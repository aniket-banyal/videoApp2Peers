const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const myVideo = document.querySelector('#myVideo video')
const myName = document.querySelector('#myVideo .name')
let myUserId
let myStream
let myVideoOn = true

const peerVideo = document.querySelector('#peerVideo video')
const peerName = document.querySelector('#peerVideo .name')
const peerNameFallback = document.querySelector('#peerVideo h1')
let peerUserId
let peerUserName

const videoBtn = document.querySelector('#videoBtn')
const audioBtn = document.querySelector('#audioBtn')
const shareScreenBtn = document.querySelector('#shareScreen')
shareScreenBtn.disabled = true

const peers = {}

const url_string = window.location.href
const url = new URL(url_string)
const myUserName = url.searchParams.get("user")

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream
        //connect to new user whose id is userId and send ur stream
    socket.on('user-connected', (userId, userName) => {
        peerUserId = userId
        peerUserName = userName
        connectToNewUser(userId, myStream)
        shareScreenBtn.disabled = false
    })

    myVideo.srcObject = myStream
    myVideo.muted = true
    myName.innerHTML = myUserName

    videoBtn.addEventListener('click', () => {
        myStream.getVideoTracks().forEach(t => {
            if (t.enabled) {
                videoBtn.innerHTML = 'Show Video'
                t.stop()
                if (connection)
                    connection.send('noVideo')
                myVideoOn = false
            } else {
                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                }).then(stream => {
                    myStream = stream
                    myVideo.srcObject = myStream
                    myPeer.call(peerUserId, myStream)
                })

                videoBtn.innerHTML = 'Hide Video'
                if (connection)
                    connection.send('video')
                myVideoOn = true
            }
            t.enabled = !t.enabled
        })
    })

    audioBtn.addEventListener('click', () => {
        stream.getAudioTracks().forEach(t => {
            if (t.enabled) {
                audioBtn.innerHTML = 'Start Mic'
            } else {
                audioBtn.innerHTML = 'Stop Mic'
            }
            t.enabled = !t.enabled
        })
    })

    //receive peerUserName when someone connects to u
    myPeer.on('connection', conn => {
        connection = conn
        shareScreenBtn.disabled = false
        conn.on('data', data => {
            if (data == 'noVideo') {
                peerVideo.style.display = 'none'
                peerNameFallback.innerHTML = peerUserName
                peerNameFallback.parentElement.style.background = 'black'
                peerName.innerHTML = ''
            } else if (data == 'video') {
                peerNameFallback.innerHTML = ''
                peerVideo.style.display = ''
                peerNameFallback.parentElement.style.background = ''
            } else {
                peerUserName = data['userName']
                peerUserId = data['id']
            }
        })
    })

    //when someone calls, we answer them and send our stream
    myPeer.on('call', call => {
        call.answer(stream)

        // when caller send its stream add it to receivers ui
        call.on('stream', userVideoStream => {
            peerVideo.srcObject = userVideoStream
            peerName.innerHTML = peerUserName
            peerNameFallback.innerHTML = ''
            peerVideo.style.display = ''
        })
        call.on('close', () => {
            peerVideo.style.display = 'none'
            peerName.innerHTML = ''
        })
    })
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, myUserName)
    myUserId = id
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

let connection

function connectToNewUser(userId, stream) {

    //make a connection to the new user and send your userName
    connection = myPeer.connect(userId)
    let call
    connection.on('open', async() => {
        await connection.send({ id: myUserId, userName: myUserName })
            //call the new user and send your stream
        call = myPeer.call(userId, stream)

        //when receiver sends its stream add it to callers ui
        call.on('stream', userVideoStream => {
            peerVideo.srcObject = userVideoStream
            peerName.innerHTML = peerUserName
            peerNameFallback.innerHTML = ''
            peerVideo.style.display = ''
        })

        call.on('close', () => {
            peerVideo.style.display = 'none'
            peerName.innerHTML = ''
        })
    })

    connection.on('data', data => {
        if (data == 'noVideo') {
            // peerVideo.src = ''
            peerVideo.style.display = 'none'
            peerNameFallback.innerHTML = peerUserName
            peerNameFallback.parentElement.style.background = 'black'
            peerName.innerHTML = ''
        } else if (data == 'video') {
            peerNameFallback.innerHTML = ''
            peerVideo.style.display = ''
            peerNameFallback.parentElement.style.background = ''
        }
    })

    peers[userId] = call
}

let captureStream
let sharingScreen = false

shareScreenBtn.addEventListener('click', async() => {
    if (sharingScreen) {
        captureStream.getTracks()[0].stop()
        shareScreenBtn.innerHTML = 'Share Screen'
        videoBtn.disabled = false
        if (myVideoOn) {
            myStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            myVideo.srcObject = myStream
            myPeer.call(peerUserId, myStream)
        } else {
            connection.send('noVideo')
        }

    } else {
        shareScreen()
        shareScreenBtn.innerHTML = 'Stop Share'
    }
    sharingScreen = !sharingScreen
})

async function shareScreen() {
    connection.send('video')
    captureStream = await navigator.mediaDevices.getDisplayMedia()

    //if user clicks on 'Stop sharing' button given by browser then this will run
    captureStream.getVideoTracks()[0].onended = async() => {
        shareScreenBtn.innerHTML = 'Share Screen'
        videoBtn.disabled = false
        if (myVideoOn) {
            myStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            myVideo.srcObject = myStream
            myPeer.call(peerUserId, myStream)
        } else {
            connection.send('noVideo')
        }

        sharingScreen = false
    }

    myPeer.call(peerUserId, captureStream)
    videoBtn.disabled = true

    myStream.getVideoTracks().forEach(t => {
        t.stop()
    })
}