import { userMutations } from './resources/user/user.schema'
import { tokenMutations } from './resources/token/token.schema';

const Mutation = `
    type Mutation {
        ${userMutations}
        ${tokenMutations}
    }
`

export {
    Mutation
}
