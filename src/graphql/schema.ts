import { makeExecutableSchema } from 'graphql-tools'
import { merge } from 'lodash'

import { Query } from './query'
import { Mutation } from './mutation'

import { userTypes } from './resources/user/user.schema'
import { userResolvers } from './resources/user/user.resolvers';
import { tokenTypes } from './resources/token/token.schema';
import { tokenResolvers } from './resources/token/token.resolver';

const resolvers = merge(
    userResolvers,
    tokenResolvers
)

const SchemaDefinition = `
    type Schema {
        query: Query
        mutation: Mutation
    }
`

export const schema = makeExecutableSchema({
    typeDefs: [
        SchemaDefinition,
        Query,
        Mutation,
        tokenTypes,
        userTypes,
    ],
    resolvers
})
