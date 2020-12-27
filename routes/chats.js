const express = require('express')
const router = express.Router()
const io = require('../node_modules/socket.io/client-dist/socket.io')

const chatController = require('../controllers/chatController')

// -----------------------------------------------------------------------------------

router.get('/public', chatController.getPublicChat)
router.get('/', (req, res) => {
    res.locals.roomName = req.query.roomName
    res.render('publicChats', { roomName: req.query.roomName })
})

// -----------------------------------------------------------------------------------

module.exports = router