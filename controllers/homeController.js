const { Op } = require("sequelize")
const bcrypt = require('bcryptjs')
const db = require('../models')
const Followship = db.Followship
const User = db.User
const helper = require('../_helpers')

module.exports = {
  signInPage: (req, res) => {
    return res.render('signin')
  },

  signUpPage: (req, res) => {
    return res.render('signup')
  },

  signIn: (req, res) => {
    res.redirect('/tweets')
  },

  signup: (req, res) => {
    const { account, name, email, password, checkPassword } = req.body
    const errors = []
    const random = Math.random() * 999
    
    if (!account || !name || !email || !password || !checkPassword) {
      errors.push({ message: 'All fields are required.' })
    }
    if (password !== checkPassword) {
      errors.push({ message: "Password doesn't match the confirm password." })
    }
    if (errors.length) {
      return res.render('signup', {
        account,
        name,
        email,
        password,
        checkPassword,
        errors
      })
    }

    User.findOne({ where: { [Op.or]: [{ account: account }, { email: email }] } })
      .then(user => {
        if (user) {
          errors.push({ message: "Account or Email already exists." })
          return res.render('signup', {
            account,
            name,
            email,
            password,
            checkPassword,
            errors
          })
        }

        return bcrypt.genSalt(10)
          .then(salt => bcrypt.hash(password, salt))
          .then(hash => User.create({
            account,
            name,
            email,
            password: hash,
            role: 'user',
            avatar: `https://loremflickr.com/320/320/portrait/?lock=${random}`,
            cover: `https://loremflickr.com/686/200/background/?lock=${random}`
          }))
          .then(user => res.redirect(302,'/signin'))
          .catch(err => console.log(err))
      })
  },

  logout: (req, res) => {
    req.flash('success_msg', 'logout successfully!')
    req.logout()
    res.redirect('/signin')
  },

  addFollowing: (req, res) => {
    if (helper.getUser(req).id === Number(req.body.id)) {
      return res.redirect(200, 'back')
    }

    return Followship.create({
      followerId: helper.getUser(req).id,
      followingId: req.body.id
    })
      .then(followship => res.redirect('back'))
  },

  removeFollowing: (req, res) => {
    return Followship.destroy({
      where: {
        followerId: helper.getUser(req).id,
        followingId: req.params.id
      }
    })
      .then(followship => {
        res.redirect('back')
      })
  }
}