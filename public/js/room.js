const socket = io('/')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const ONE_MB = 1000000

const videoGrid = document.querySelector('#video-grid')
const chatWindow = document.querySelector('#chatWindow')
const chatInput = document.querySelector('#chatInput')
const sendMsgBtn = document.querySelector('#sendMsgBtn')
const chats = document.querySelector('#chats')

const myVideo = document.querySelector('#myVideo video')
const myName = document.querySelector('#myVideo .name')
let myUserId
let myStream
let myVideoOn = false

const peerVideo = document.querySelector('#peerVideo video')
const peerName = document.querySelector('#peerVideo .name')
const peerNameFallback = document.querySelector('#peerVideo h1')
let peerUserId
let peerUserName
let peerSharingScreen = false

const videoBtn = document.querySelector('#videoBtn')
const audioBtn = document.querySelector('#audioBtn')

const shareScreenBtn = document.querySelector('#shareScreenBtn')

const selectFileDialog = document.querySelector('#selectFileDialog')
const shareFileBtn = document.querySelector('#shareFileBtn')
const shareFileOkBtn = document.querySelector('#shareFileOkBtn')
const selectFileInput = document.querySelector('#selectFileInput')

const fileShareStatusDialog = document.querySelector('#fileShareStatusDialog')
const fileShareStatus = document.querySelector('#fileShareStatus')

const fileRequestDialog = document.querySelector('#fileRequestDialog')
const fileRequestMsg = document.querySelector('#fileRequestMsg')
const fileRequestAcceptBtn = document.querySelector('#fileRequestAcceptBtn')

const url_string = window.location.href
const url = new URL(url_string)
const myUserName = url.searchParams.get("user")

const peers = {}

let connection

let file

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, myUserName)
    myUserId = id
})

//receive peerUserName when someone connects to u
myPeer.on('connection', conn => {
    connection = conn
    shareScreenBtn.disabled = false
    shareFileBtn.disabled = false
    connection.on('data', data => {
        handleConnectionData(data)
    })
})


navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true
}).then(stream => {
    myStream = stream
        //connect to new user whose id is userId and send ur stream
    socket.on('user-connected', (userId, userName) => {
        peerUserId = userId
        peerUserName = userName
        connectToNewUser(userId, myStream)
        peerVideo.parentElement.style.display = ''
        shareScreenBtn.disabled = false
        shareFileBtn.disabled = false
    })

    myVideo.srcObject = myStream
    myVideo.muted = true
    myName.innerHTML = myUserName

    setEventListeners()

    //when someone calls, we answer them and send our stream
    myPeer.on('call', call => {
        call.answer(myStream)
        handleCall(call)
        myVideoOn && !peerSharingScreen ? connection.send('video') : connection.send('noVideo')
    })
})


socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        onPeerDisconnect()
        peers[userId].close()
    }
})


function setEventListeners() {
    videoBtn.addEventListener('click', toggleVideo)
    audioBtn.addEventListener('click', toggleAudio)

    shareFileBtn.addEventListener('click', () => {
        selectFileDialog.style.display = 'block';
        fileShareStatus.innerHTML = ''
    });

    document.getElementById('shareFileCancelBtn').addEventListener('click', () => {
        selectFileInput.value = '';
        selectFileDialog.style.display = 'none';
    });

    selectFileInput.addEventListener('change', (e) => {
        file = e.target.files[0];
        shareFileOkBtn.disabled = !file;
    });

    shareFileOkBtn.addEventListener('click', shareFile)

    chatInput.oninput = () => {
        chatInput.value !== '' && connection ? sendMsgBtn.disabled = false : sendMsgBtn.disabled = true
    }

    //if enter is pressed on chatInput then send message
    chatInput.addEventListener('keyup', (e) => {
        if (e.keyCode === 13 && chatInput.value !== '')
            sendMsgBtn.click()
    })

    sendMsgBtn.addEventListener('click', () => {
        connection.send({ msg: chatInput.value })

        createMsg('myMsg', chatInput.value)

        chatInput.value = ''
        chatInput.focus()
        sendMsgBtn.disabled = true
    })
}

function createMsg(type, text) {
    const div = document.createElement('div')
    div.classList.add(type)
    const p = document.createElement('p')
    const pTime = document.createElement('p')
    pTime.classList.add('time')
    pTime.innerHTML = new Date().toLocaleTimeString(['en-GB'], { hour: '2-digit', minute: '2-digit' });
    p.innerHTML = text
    div.append(p)
    div.append(pTime)
    chats.append(div)

    chats.scrollTop = chats.scrollHeight;
}

function onPeerDisconnect() {
    peerVideo.style.display = 'none'
    peerName.innerHTML = ''
    peerVideo.parentElement.style.display = 'none'
    peerNameFallback.innerHTML = ''
    sendMsgBtn.disabled = true
    shareScreenBtn.disabled = true
    shareFileBtn.disabled = true
    connection = null
}

function connectToNewUser(userId, stream) {

    //make a connection to the new user and send your userName
    connection = myPeer.connect(userId)
    let call
    connection.on('open', async() => {
        await connection.send({ id: myUserId, userName: myUserName })
            //call the new user and send your stream
        call = myPeer.call(userId, stream)
        handleCall(call)
        myVideoOn ? connection.send('video') : connection.send('noVideo')
    })

    connection.on('data', data => {
        handleConnectionData(data)
    })

    peers[userId] = call
}

function handleConnectionData(data) {
    if (data == 'noVideo') {

        peerVideo.style.display = 'none'
        peerNameFallback.innerHTML = peerUserName
        peerNameFallback.parentElement.style.background = 'black'
        peerName.innerHTML = ''

    } else if (data == 'video') {

        peerNameFallback.innerHTML = ''
        peerNameFallback.parentElement.style.background = ''
        peerVideo.style.display = ''
        peerName.innerHTML = peerUserName

    } else if (data == 'sharingScreen') {

        peerSharingScreen = true
        videoBtn.disabled = true
        shareScreenBtn.disabled = true
        peerNameFallback.innerHTML = ''
        peerVideo.style.display = ''
        peerNameFallback.parentElement.style.background = ''
        myVideo.parentElement.style.display = 'none'
        chatWindow.style.display = 'none'
        videoGrid.style.gridTemplateColumns = '1fr'
            //stop my video if other user is sharing screen
        myStream.getVideoTracks().forEach(t => {
            t.stop()
        })

    } else if (data == 'screenShareStopped') {

        peerSharingScreen = false
        videoBtn.disabled = false
        shareScreenBtn.disabled = false
        videoGrid.style.gridTemplateColumns = '1fr 3fr'
        chatWindow.style.display = ''

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

    } else if (data.hasOwnProperty('id') && data.hasOwnProperty('userName')) {

        peerUserName = data['userName']
        peerUserId = data['id']

    } else if (data.hasOwnProperty('name') && data.hasOwnProperty('size')) {

        let size

        if (data.size < ONE_MB / 10)
            size = data.size + ' KB'
        else
            size = (data.size / ONE_MB).toFixed(2) + ' MB'

        fileRequestAcceptBtn.addEventListener('click', () => {
            connection.send('fileRequestAccepted')
            fileRequestDialog.style.display = 'none'
        })

        fileRequestDenyBtn.addEventListener('click', () => {
            connection.send('fileRequestDenied')
            fileRequestDialog.style.display = 'none'
        })

        fileRequestMsg.innerHTML = `${peerUserName} wants to send a file ${data.name} (${size}). Accept ?`
        fileRequestDialog.style.display = ''

    } else if (data == 'fileRequestAccepted') {

        connection.send({ name: file.name, file: file })
        fileShareStatus.innerHTML = 'Sent!'
        setTimeout(() => fileShareStatusDialog.style.display = 'none', 2000)

    } else if (data == 'fileRequestDenied') {

        fileShareStatus.innerHTML = `${peerUserName} didn't accept your request to share file`
        setTimeout(() => fileShareStatusDialog.style.display = 'none', 2000)

    } else if (data.hasOwnProperty('name') && data.hasOwnProperty('file')) {

        const blob = new Blob([data['file']]);
        downloadFile(blob, data['name'])

    } else if (data.hasOwnProperty('msg')) {
        createMsg('peerMsg', data['msg'])
    }

}

function shareFile() {
    if (file) {
        connection.send({ name: file.name, size: file.size })
        fileShareStatus.innerHTML = 'Sending....'
        fileShareStatusDialog.style.display = ''
        selectFileDialog.style.display = 'none'
    }
}

function toggleVideo() {
    if (myStream.getVideoTracks().length > 0) {

        myStream.getVideoTracks().forEach(t => {
            if (t.enabled) {
                t.stop()
                if (connection)
                    connection.send('noVideo')
                videoBtn.innerHTML = 'Show Video'
                myVideoOn = false
            } else
                startVideo()

            t.enabled = !t.enabled
        })
    } else
        startVideo()

}

function startVideo() {
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

function toggleAudio() {
    myStream.getAudioTracks().forEach(t => {
        if (t.enabled) {
            audioBtn.innerHTML = 'Start Mic'
        } else {
            audioBtn.innerHTML = 'Stop Mic'
        }
        t.enabled = !t.enabled
    })
}

function handleCall(call) {
    // when caller send its stream add it to receivers ui
    call.on('stream', userVideoStream => {
        peerVideo.srcObject = userVideoStream
    })

    call.on('close', () => {
        onPeerDisconnect()
    })

}

function downloadFile(blob, fileName) {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove()
};

let captureStream
let sharingScreen = false

shareScreenBtn.addEventListener('click', () => {
    if (sharingScreen)
        stopScreenShare()
    else
        shareScreen()
    sharingScreen = !sharingScreen
})


async function stopScreenShare() {
    captureStream.getTracks()[0].stop()
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
    } else
        connection.send('noVideo')
}

async function shareScreen() {
    shareScreenBtn.innerHTML = 'Stop Share'

    captureStream = await navigator.mediaDevices.getDisplayMedia()

    await connection.send('sharingScreen')
    myPeer.call(peerUserId, captureStream)

    //if user clicks on 'Stop sharing' button given by browser then this will run
    captureStream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
        sharingScreen = false
    }

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