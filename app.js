const express = require('express')
const exhbs = require('express-handlebars')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const helpers = require('./_helpers')
const routes = require('./routes')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const session = require('express-session')
const passport = require('./config/passport')

const app = express()
const port = process.env.PORT || 3000
const sessionMiddleware = session({ secret: 'simpleTweetSecret', resave: false, saveUninitialized: false })

//socket
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
const activeUsers = new Set()

io.use(wrap(sessionMiddleware))
io.use(wrap(passport.initialize()))
io.use(wrap(passport.session()))

io.use((socket, next) => {
  if (socket.request.user) {
    next()
  } else {
    next(new Error('unauthorized'))
  }
})
const db = require('./models')
const moment = require('moment')
moment.locale('zh-TW')
const Tweet = db.Tweet
const Chat = db.Chat
const User = db.User
io.on('connection', (socket) => {

  const str = socket.handshake.headers.referer.split('=')
  const roomName = str[1] || 'public'
  socket.join(`${roomName}`)

  console.log(`new connection ${socket.id}`)
  socket.to(`${roomName}`).broadcast.emit("hello", socket.request.user.name)


  socket.on('new user', (data) => {
    activeUsers.add(socket.request.user)
    io.to(`${roomName}`).emit('new user', [...activeUsers])
  })


  socket.on('chat message', (data) => {
    data.user = socket.request.user
    data.roomName = roomName
    const msg = {
      UserId: socket.request.user.id,
      message: data.msg,
      roomName: roomName
    }
    Chat.create(msg)
    io.to(`${roomName}`).emit('chat message', data)
  })


  socket.to(`${roomName}`).on('disconnect', () => {
    activeUsers.delete(socket.request.user)
    io.to(`${roomName}`).emit('user disconnected', { id: socket.request.user.id, name: socket.request.user.name })
  })


  socket.on('history', () => {
    Chat.findAll({ raw: true, nest: true, order: [['createdAt', 'ASC']], include: [User], where: {roomName: roomName} }).then(msgs => {
      console.log(msgs)
      msgs = msgs.map(item => ({
        user: item.User.name,
        message: item.message,
        formattedTime: moment(item.createdAt).format('a h:mm'),
        currentUser: item.User.id === socket.request.user.id ? true : false
      }))
      io.to(`${roomName}`).emit('history', { msgs })
    })
  })
})


server.listen(3000)

app.use(express.static('public'))
app.engine('hbs', exhbs({ defaultLayout: 'main', extname: 'hbs', helpers: require('./config/handlebars-helper') }))
app.set('view engine', 'hbs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.user = req.user
  next()
})

app.use('/upload', express.static(__dirname + '/upload'))




// use helpers.getUser(req) to replace req.user
// use helpers.ensureAuthenticated(req) to replace req.isAuthenticated()
// app.listen(port, () => console.log(`Example app listening on port ${port}!`))


app.use(routes)

module.exports = app
