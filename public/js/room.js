const socket = io('/')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const videoGrid = document.querySelector('#video-grid')

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

let connection

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
                t.stop()
                if (connection)
                    connection.send('noVideo')
                videoBtn.innerHTML = 'Show Video'
                myVideoOn = false
            } else {
                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                }).then(stream => {
                    myStream = stream
                    myVideo.srcObject = myStream
                    myPeer.call(peerUserId, myStream)
                    if (connection)
                        connection.send('video')
                })

                videoBtn.innerHTML = 'Hide Video'
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
            handleConnectionData(data)
        })
    })

    //when someone calls, we answer them and send our stream
    myPeer.on('call', call => {
        call.answer(stream)
        handleCall(call)
    })
})


function handleCall(call) {
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

}
myPeer.on('open', id => {
    socket.emit('join-room', id, myUserName)
    myUserId = id
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
    peerVideo.style.display = 'none'
    peerName.innerHTML = ''
})

function connectToNewUser(userId, stream) {

    //make a connection to the new user and send your userName
    connection = myPeer.connect(userId)
    let call
    connection.on('open', async() => {
        await connection.send({ id: myUserId, userName: myUserName })
            //call the new user and send your stream
        call = myPeer.call(userId, stream)
        handleCall(call)
    })

    connection.on('data', data => {
        handleConnectionData(data)
    })

    peers[userId] = call
}

function handleConnectionData(data) {
    if (data == 'noVideo') {
        peerVideo.src = ''
        peerVideo.style.display = 'none'
        peerNameFallback.innerHTML = peerUserName
        peerNameFallback.parentElement.style.background = 'black'
        peerName.innerHTML = ''
    } else if (data == 'video') {
        peerNameFallback.innerHTML = ''
        peerNameFallback.parentElement.style.background = ''
        peerVideo.style.display = ''
    } else if (data == 'sharingScreen') {
        peerNameFallback.innerHTML = ''
        peerVideo.style.display = ''
        peerNameFallback.parentElement.style.background = ''
        myVideo.parentElement.style.display = 'none'
        videoGrid.style.gridTemplateColumns = '1fr'
            //stop my video if other user is sharing screen
        myStream.getVideoTracks().forEach(t => {
            t.stop()
        })
    } else if (data == 'screenShareStopped') {
        videoGrid.style.gridTemplateColumns = '1fr 3fr'
            //after the other user has stopped sharing screen, turn on my video if it was on before sharing began
        if (myVideoOn) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(stream => {
                myStream = stream
                myVideo.srcObject = myStream
                myPeer.call(peerUserId, myStream)
                connection.send('video')
            })
        }
        //this should come after the above if, otherwise if peer's video was originally off and he turns off
        //screen share and then turns on his video then u'll see the last frame of screen share
        myVideo.parentElement.style.display = ''
    } else {
        peerUserName = data['userName']
        peerUserId = data['id']
    }
}

let captureStream
let sharingScreen = false

shareScreenBtn.addEventListener('click', () => {
    if (sharingScreen) {
        captureStream.getTracks()[0].stop()
        stopScreenShare()
    } else {
        shareScreen()
        shareScreenBtn.innerHTML = 'Stop Share'
    }
    sharingScreen = !sharingScreen
})

async function stopScreenShare() {
    connection.send('screenShareStopped')
    shareScreenBtn.innerHTML = 'Share Screen'
    videoBtn.disabled = false
        //after I stop sharing screen, turn on my video if it was on before sharing began
    if (myVideoOn) {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        myVideo.srcObject = myStream
        myPeer.call(peerUserId, myStream)
            // connection.send('video')
    } else {
        connection.send('noVideo')
    }
}

async function shareScreen() {
    captureStream = await navigator.mediaDevices.getDisplayMedia()

    //if user clicks on 'Stop sharing' button given by browser then this will run
    captureStream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
        sharingScreen = false
    }

    myPeer.call(peerUserId, captureStream)
    connection.send('sharingScreen')

    //if I am sharing screen I disable my videoBtn
    videoBtn.disabled = true

    //If i start sharing screen, turn off my video
    myStream.getVideoTracks().forEach(t => {
        t.stop()
    })

    //If i start sharing screen, peers video will be turned off so do this
    peerVideo.style.display = 'none'
    peerNameFallback.innerHTML = peerUserName
    peerNameFallback.parentElement.style.background = 'black'
    peerName.innerHTML = ''
}