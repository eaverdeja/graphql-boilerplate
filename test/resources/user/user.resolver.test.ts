import * as jwt from 'jsonwebtoken'

import { db, app, handleError, expect, chai } from "../../test-utils";
import { UserInstance } from "../../../src/models/UserModel";
import { JWT_SECRET } from '../../../src/utils/utils';

describe('User', () => {

    let userId: number
    let token: string

    beforeEach(() => {
        return db.User.destroy({where: {}})
            .then((rows: number) => 
                db.User.bulkCreate([
                    {
                        name: 'Van Hohenheim',
                        email: 'philosopher@stone.com',
                        password: '1234'
                    }, {
                        name: 'Edward Elric',
                        email: 'alchemist@army.com',
                        password: '1234'
                    }, {
                        name: 'Alphonse Elric',
                        email: 'soul@armor.com',
                        password: '1234'
                    }
                ]).then((users: UserInstance[]) => {
                    userId = users[0].get('id')
                    const payload = {sub: userId}
                    token = jwt.sign(payload, JWT_SECRET)
                })
            )
    })

    describe('Queries', () => {

        describe('application/json', () => {

            describe('users', () => {

                it('should return a list of Users', () => {
                    let body = {
                        query: `
                            query {
                                users {
                                    name
                                    email
                                }
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const usersList = res.body.data.users
                            expect(res.body.data).to.be.an('object')
                            expect(usersList[0]).to.not.have.keys(['photo', 'createdAt', 'updatedAt'])
                            expect(usersList[0]).to.have.keys(['name', 'email'])
                        }).catch(handleError)
                })

                it('should paginate a list of Users', () => {

                    let body = {
                        query: `
                            query getUsersList($first: Int, $offset: Int) {
                                users(first: $first, offset: $offset) {
                                    name
                                    email
                                    createdAt
                                }
                            }
                        `,
                        variables: {
                            first: 2,
                            offset: 1
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const usersList = res.body.data.users
                            expect(res.body.data).to.be.an('object')
                            expect(usersList).to.be.an('array').of.length(2)
                            expect(usersList[0]).to.not.have.keys(['photo', 'updatedAt'])
                            expect(usersList[0]).to.have.keys(['name', 'email', 'createdAt'])
                        }).catch(handleError)
                })

            })

            describe('user', () => {

                it('should return a single User', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    id
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user
                            expect(res.body.data).to.be.an('object')
                            expect(singleUser).to.be.an('object')
                            expect(singleUser).to.have.keys(['id', 'name', 'email'])
                            expect(singleUser.name).to.equal('Van Hohenheim')
                            expect(singleUser.email).to.equal('philosopher@stone.com') 
                        }).catch(handleError)
                })

                it('should return only \'name\' attribute', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    name
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user
                            expect(res.body.data).to.be.an('object')
                            expect(singleUser).to.be.an('object')
                            expect(singleUser).to.have.key('name')
                            expect(singleUser.name).to.equal('Van Hohenheim')
                            expect(singleUser.email).to.undefined
                        }).catch(handleError)
                })


                it('should return an error if the user does not exist', () => {

                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    name
                                }
                            }
                        `,
                        variables: {
                            id: -1
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.user).to.be.null
                            expect(res.body.errors).to.be.an('array')
                            expect(res.body).to.have.keys(['data', 'errors'])
                            expect(res.body.errors[0].message).to.equal(`Error: User with id ${-1} not found`)
                        }).catch(handleError)
                })

            })

            describe('currentUser', () => {

                it('should return the User owner of the token', () => {

                    let body = {
                        query: `
                            query {
                                currentUser {
                                    name
                                    email
                                }
                            }
                        `,
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const currentUser = res.body.data.currentUser
                            expect(currentUser).to.be.an('object')
                            expect(currentUser).to.have.keys(['name', 'email'])
                            expect(currentUser.name).to.equal('Van Hohenheim')
                            expect(currentUser.email).to.equal('philosopher@stone.com')
                        }).catch(handleError)
                })

            })

        })

    })

    describe('Mutations', () => {
      
        describe('application/json', () => {

            describe('createUser', () => {
        
                it('should create a new User', () => {
                    let body = {
                        query: `
                            mutation createNewUser($input: UserCreateInput!) {
                                createUser(input: $input) {
                                    id
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Drax',
                                email: 'drax@guardians.com',
                                password: '1234'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdUser = res.body.data.createUser
                            expect(createdUser).to.be.an('object')
                            expect(createdUser.name).to.equal('Drax')
                            expect(createdUser.email).to.equal('drax@guardians.com')
                            expect(parseInt(createdUser.id)).to.be.a('number')
                        }).catch(handleError)
                })

            })

            describe('updateUser', () => {
        
                it('should update an existing User', () => {
                    let body = {
                        query: `
                            mutation updateExistingUser($input: UserUpdateInput!) {
                                updateUser(input: $input) {
                                    name
                                    email
                                    photo
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Star Lord',
                                email: 'starlord@guardians.com',
                                photo: 'oi'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedUser = res.body.data.updateUser
                            expect(updatedUser).to.be.an('object')
                            expect(updatedUser.name).to.equal('Star Lord')
                            expect(updatedUser.email).to.equal('starlord@guardians.com')
                            expect(updatedUser.photo).to.not.be.null
                            expect(updatedUser.id).to.be.undefined
                        }).catch(handleError)
                })
                
            })

            describe('updateUserPassword', () => {
        
                it('should update the password of an existing User', () => {
                    let body = {
                        query: `
                            mutation updateExistingUserPassword($input: UserUpdatePasswordInput!) {
                                updateUserPassword(input: $input)
                            }
                        `,
                        variables: {
                            input: {
                                password: '1234'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedPassword = res.body.data.updateUserPassword
                            expect(updatedPassword).to.be.a('boolean')
                            expect(updatedPassword).to.equal(true)
                        }).catch(handleError)
                })
                
            })

            describe('deleteUser', () => {
            
                it('should delete an existing User', () => {
                    let body = {
                        query: `
                            mutation {
                                deleteUser
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.deleteUser).to.be.true
                        }).catch(handleError)
                })

                it('should block the operation if the token is not provided', () => {
                    let body = {
                        query: `
                            mutation {
                                deleteUser
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.errors[0].message).to.equal('Unathorized! Token not provided!')
                        }).catch(handleError)
                })

                it('should block the operation if the wrong token is provided', () => {
                    let body = {
                        query: `
                            mutation {
                                deleteUser
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer wrongToken`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.errors[0].message).to.equal('JsonWebTokenError: jwt malformed')
                        }).catch(handleError)
                })
                
            })

        })

    })

})
