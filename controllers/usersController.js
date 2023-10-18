const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

//GET USERS
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users) {
        return res.status(400).json({ message: 'No users found'})
    }
    res.json(users)
})

//CREATE NEW USER
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body
// confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All fields are required.'})
    }
// check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username'})
    }
// hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, 'password': hashedPwd, roles}

    // Create and store new user

    const user = await User.create(userObject)

    if(user) {
        res.status(201).json({ message: `New user ${username} created`})
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
})

//UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields required '})
    }

    const user = await User.findById(id).exec()

    if (!user) {
       return res.status(400).json({ message: 'User not found' }) 

       //Check for dups
       const duplicate = await User.findOne({ username }).lean().exec()
       // Allow updates to the original user
       if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username'})
       }
       user.username = username
       user.roles = roles
       user.active = active

       if (password) {
        //hash password
        user.password = await bcrypt.hash(password, 10)
       }
       const updatedUser = await user.save()

       res.json({ message: `${updatedUser.username} updated`})
    }
})

//DELETE USER
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: 'User ID required'})
    }

    const notes = await Note.findOne({ user: id }).lean().exec()
    if (notes?.length) {
        return res.status(400).json({ message: 'User has assigned notes'})
    }
    
    const user = await User.findById(id).exec()

    if(!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports =  {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}


