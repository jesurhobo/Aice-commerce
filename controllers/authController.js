const User = require('../models/User')
const {StatusCodes} = require('http-status-codes')
const customError = require('../errors')
const {attachCookiesToResponse, createTokenUser} = require('../utils')


const register = async (req, res) => {
    const {name, email, password} = req.body;

    const emailAlreadyExists = await User.findOne({email})
    if (emailAlreadyExists){
        throw new customError.BadRequestError('Email already exists')
    }
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin': 'user';

    const user = await User.create({name, email, password, role})
    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({res, user: tokenUser})
    
    res.status(StatusCodes.CREATED).json({user: tokenUser})
}

const login = async (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        throw new customError.BadRequestError('Please provide email or password')
    }
    const user = await User.findOne({email})
    if (!user){
        throw new customError.UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.comparePasswords(password)
    if (!isPasswordCorrect) {
        throw new customError.UnauthenticatedError('Incorrect Password')
    }
    const tokenUser = createTokenUser(user) //idg this line and the next, basically i have trouble w auth and jwt etc
    attachCookiesToResponse({res, user: tokenUser})
    
    res.status(StatusCodes.OK).json({user: tokenUser})
}
const logout = async (req, res) => { //idg this
    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now() + 5 * 1000)
    })
    res.status(StatusCodes.OK).json({ msg: 'user logged out!'})
}

module.exports = {
    register,  
    login,
    logout
}