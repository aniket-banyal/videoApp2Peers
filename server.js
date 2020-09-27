const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
    // const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/room', (req, res) => {
    res.render('room')
})

const roomId = 1
    //when a connnection is made to the server by client
io.on('connection', socket => {
    //when "join-room event is emitted"
    socket.on('join-room', (userId, userName) => {

        //join to that particular room
        socket.join(roomId)

        //send data about existing users to new user
        socket.to(roomId).broadcast.emit('user-connected', userId, userName)

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        })
    })
})

server.listen(3000)
console.log("Listening")