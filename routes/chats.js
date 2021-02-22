const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chatController')
const db = require('../models')
const User = db.User
// -----------------------------------------------------------------------------------
// router.get('/', chatController.get)
router.get('/public', chatController.getPublicChat)


// -----------------------------------------------------------------------------------

module.exports = router
