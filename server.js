const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
    // const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    // res.render('home', { roomId: `/${uuidV4()}` })
    res.render('home', { roomId: genRoomId() })
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room, myVideoOn: req.query.video })
})

//when a connnection is made to the server by client
io.on('connection', socket => {
    //when "join-room event is emitted"
    socket.on('join-room', (roomId, userId, userName) => {
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

//generate random RoomID
function genRoomId() {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}