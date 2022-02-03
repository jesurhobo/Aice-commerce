const User = require('../models/User')
const {StatusCodes} = require('http-status-codes')
const customError = require('../errors')
const {attachCookiesToResponse, createTokenUser, checkPermissions} = require('../utils')

const getAllUsers = async (req, res) => {
    console.log(req.user);
    const users = await User.find({role: 'user'}).select('-password')

    res.status(StatusCodes.OK).json({users})
}
const getSingleUser = async (req, res) => {
    const user = await User.findOne({_id:req.params.id}).select('-password')
    if(!user){
        throw new customError.NotFoundError(`No user with id:${req.params.id}`)
    }
    checkPermissions(req.user, user._id)
    res.status(StatusCodes.OK).json({user})
}
const showCurrentUser = async (req, res) => {
    res.status(StatusCodes.OK).json({user: req.user})
}
// update user with user.save()
const updateUser = async (req, res) => {
    const {name, email} = req.body
    if (!name || !email) {
        throw new customError.BadRequestError('Please provide both values')
    }
    const user = await User.findOne({_id: req.user.userId})

    user.email = email
    user.name = name

    await user.save()

    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({res, user: tokenUser})
    res.status(StatusCodes.OK).json({user: tokenUser})
    }

    const updateUserPassword = async (req, res) => {
        const {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword){
            throw new customError.BadRequestError('Please provide both values')
        }
        const user = await User.findOne({ _id: req.user.userId}) //whats the essence?
        
        const isPasswordCorrect = await user.comparePasswords(oldPassword)
        if (!isPasswordCorrect) {
            throw new customError.UnauthenticatedError('Invalid Credentials')
        }
        user.password = newPassword
        await user.save()
        res.status(StatusCodes.OK).json({msg: 'Success! Password updated!'})
    }
    
    module.exports = {getAllUsers, getSingleUser, showCurrentUser, updateUser, updateUserPassword}
    
    
    // Update user with findOneAndUpdate
    // const updateUser = async (req, res) => {
    //     const {name, email} = req.body
    //     if (!name || !email) {
    //         throw new customError.BadRequestError('Please provide both values')
    //     }
    //     const user = await User.findOneAndUpdate(
    //         {_id: req.user.userId},
    //         {name, email},
    //         {new: true, runValidators: true})
    //     const tokenUser = createTokenUser(user)
    //     attachCookiesToResponse({res, user: tokenUser})
    //     res.status(StatusCodes.OK).json({user: tokenUser})
    // }