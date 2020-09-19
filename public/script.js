const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const videoBtn = document.querySelector('#videoBtn');
const audioBtn = document.querySelector('#audioBtn');

const peers = {}

const url_string = window.location.href
const url = new URL(url_string);
const myUserName = url.searchParams.get("user");

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {

    //create video stream when user joins
    const { video, nameP, div } = createDiv()
    addVideoStream(video, stream, nameP, myUserName, div)
    video.muted = true

    videoBtn.addEventListener('click', () => {
        stream.getVideoTracks().forEach(t => {
            if (t.enabled) {
                videoBtn.innerHTML = 'Show Video'
            } else {
                videoBtn.innerHTML = 'Hide Video'
            }
            t.enabled = !t.enabled;
        });
    })

    audioBtn.addEventListener('click', () => {
        stream.getAudioTracks().forEach(t => {
            if (t.enabled) {
                audioBtn.innerHTML = 'Start Mic'
            } else {
                audioBtn.innerHTML = 'Stop Mic  '
            }
            t.enabled = !t.enabled;
        });
    })

    //receive userName when someone connects to u
    let userName;
    myPeer.on('connection', conn => {
        conn.on('data', name => {
            userName = name
        })
    })

    //when someone calls, we answer them and send our stream
    myPeer.on('call', call => {
        call.answer(stream)
        const { video, nameP, div } = createDiv()

        // when caller send its stream add it to receivers ui
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, nameP, userName, div)
        })
        call.on('close', () => {
            div.remove()
        })
    })

    //connect to new user whose id is userId and send ur stream
    socket.on('user-connected', (userId, userName) => {
        connectToNewUser(userId, stream, userName)
    })
})


myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, myUserName)
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})


function connectToNewUser(userId, stream, userName) {

    //make a connection to the new user and send your username
    const conn = myPeer.connect(userId)
    let call
    conn.on('open', () => {
        conn.send(myUserName);
        //call the new user and send your stream
        call = myPeer.call(userId, stream);
        const { video, nameP, div } = createDiv()

        //when receiver sends its stream add it to callers ui
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, nameP, userName, div)
        })

        call.on('close', () => {
            div.remove()
        })
    })

    peers[userId] = call
}

//create a div containing a video and name paragraph
function createDiv() {
    const video = document.createElement('video');
    const nameP = document.createElement('P');
    const div = document.createElement('div');
    div.append(video);
    div.append(nameP);
    return { video, nameP, div };
}

function addVideoStream(video, stream, nameP, userName, div) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    nameP.innerHTML = userName
    videoGrid.append(div);
}