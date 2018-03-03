import { GraphQLResolveInfo } from "graphql";
import * as Bluebird from "bluebird";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { UserInstance, UserAttributes } from "../../../models/UserModel";
import { Transaction, FindOptions } from "sequelize";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolver, authResolvers } from "../../composable/auth.resolver";
import { queryLoggerResolver } from "../../composable/query-logger.resolver";
import { verifyTokenResolver } from "../../composable/verify-token.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { RequestedFields } from "../../ast/RequestedFields";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

/**
 * Consulta o banco de dados pelo usuário com o ID especificado
 * 
 * @param db A instância de conexão com o banco de dados
 * @param id O ID do usuário
 * @param options Um objeto de configurações para a consulta do sequelize
 */
const findUser = (db: DbConnection, id, options: FindOptions<UserAttributes> = {}) => {
    id = parseInt(id)
    return db.User
        .findById(id, options)
        .then((user: UserInstance) => {
            throwError(!user, `User with id ${id} not found`)
            return user
        }).catch(handleError)
}

/**
 * A assinatura necessária para a execução
 * da mutação passada como callback
 * 
 * @param t Uma transação aberta no banco de dados
 * @param user Uma instância de usuário 
 * @param input Inputs opcionais para a mutação
 */
type UserAction = (t: Transaction, user: UserInstance, input?) => any

/**
 * Protege resolvers específicos ao delegar a
 * mutação específica para o callback UserAction fornecedido como parâmetro.
 * Antes de delegar para a mutação com os parâmetros necessários,
 * a função compõe os resolvers responsáveis pela autenticação da API
 * e abre uma transação no banco de dados
 * 
 * @param action Uma mutação específica passada como callback 
 */
const mutateUser = (action: UserAction): any => {
    return compose(...authResolvers)((parent, {input}, { db, authUser }: {db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
        return db.sequelize.transaction((t: Transaction) => {
            return findUser(db, authUser.id)
                .then((user: UserInstance) => action(t, user, input))
        }).catch(handleError)
    })
}

//Usado abaixo...
const shoudLog = false

export const userResolvers = {
    User: {
        /** Resolvers para tipos customizados seriam definidos aqui */
    },

    Query: {
        users: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.User
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info)
                })
                .catch(handleError)
        },

        user: (parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) =>
            findUser(context.db, id, {
                attributes: context
                    .requestedFields
                    .getFields(info, {
                        exclude: []
                    })
            })
        ,

        currentUser: compose(...authResolvers)(
            (parent, args, context: ResolverContext, info: GraphQLResolveInfo) =>
                findUser(context.db, context.authUser.id, {
                    attributes: context
                        .requestedFields
                        .getFields(info, {
                            keep: ['id']
                        })
                })
                .then((user: UserInstance) => user )
        )
    },

    Mutation: {
        //Também podemos usar o compose com condicionais!
        createUser: compose(...(shoudLog ? [queryLoggerResolver] : []))
        (
            (parent, args, {db}: {db: DbConnection}, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User 
                    .create(args.input, {transaction: t})
            }).catch(handleError)
        }),

        updateUser: 
            mutateUser((t: Transaction, user: UserInstance, input) =>
                user.update(input, {transaction: t}))
        ,
        
        updateUserPassword:
            mutateUser((t: Transaction, user: UserInstance, input) =>
                user.update(input, {transaction: t})
                    .then((user: UserInstance) => !!user))
        ,

        deleteUser:
            mutateUser((t: Transaction, user: UserInstance) =>
                user.destroy({transaction: t})
                    .then((user) => !!user))
    }
}
