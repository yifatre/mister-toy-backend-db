import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'

export const authService = {
    signup,
    login,
    getLoginToken,
    validateToken
}

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)

    const user = await userService.getByUsername(username)
    if (!user) throw new Error('Invalid username or password')

    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new Error('Invalid username or password')

    delete user.password
    return user
}

async function signup(username, password, fullName) {
    const saltRounds = 10

    logger.debug(`auth.service - signup with username: ${username}, fullName: ${fullName}`)
    if (!username || !password || !fullName) throw new Error('Missing details')

    const hash = await bcrypt.hash(password, saltRounds)
    return userService.add({ username, password: hash, fullName })
}

function getLoginToken(user) {
    const userInfo = {_id : user._id, fullName: user.fullName, isAdmin: user.isAdmin}
    return cryptr.encrypt(JSON.stringify(userInfo))    
}

function validateToken(loginToken) {
    try {
        const json = cryptr.decrypt(loginToken)
        const loggedInUser = JSON.parse(json)
        return loggedInUser
    } catch(err) {
        console.log('Invalid login token')
    }
    return null
}