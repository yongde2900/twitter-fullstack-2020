const helper = require('../_helpers')

const db = require('../models')
const User = db.User

// -----------------------------------------------------------------------------------

module.exports = {
  getPublicChat:  (req, res) => {
    const isAuthenticated = !!req.user;
    if (isAuthenticated) {
        console.log(`user is authenticated, session is ${req.session.id}`);
        return res.render('publicChats');
    } else {
        console.log("unknown user");
        return res.redirect('/signin')
    }
  },
  getPrivacyChat: (req, res) => {
    const currentUser = req.user
    User.findAll({raw: true, where: {role: 'user'}}).then(users => {
        users = users.filter( user => user.id !== currentUser.id)
        users = users.map( user => {
            const roomNumber = [currentUser.id, user.id].sort((a, b) => b - a)
            const roomName = `roomName${roomNumber[1]}-${roomNumber[0]}`
            user.roomName = roomName
            return user
        })
        res.render('privacyChat', { roomName: req.query.roomName, currentUser, users })
    })
}
}