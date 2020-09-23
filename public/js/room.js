const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const myVideo = document.querySelector('#myVideo video');
const myName = document.querySelector('#myVideo .name');


const peerVideo = document.querySelector('#peerVideo video');
const peerName = document.querySelector('#peerVideo .name');

const videoBtn = document.querySelector('#videoBtn');
const audioBtn = document.querySelector('#audioBtn');
const shareScreenBtn = document.querySelector('#shareScreen');

const peers = {}

const url_string = window.location.href
const url = new URL(url_string);
const myUserName = url.searchParams.get("user");

let myUserId;
let otherUserId;

let myStream;

let peerUserName;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream;
    //connect to new user whose id is userId and send ur stream
    socket.on('user-connected', (userId, userName) => {
        otherUserId = userId
        peerUserName = userName;
        connectToNewUser(userId, stream)
    })

    myVideo.srcObject = stream;
    myName.innerHTML = myUserName;

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

    //receive peerUserName when someone connects to u
    myPeer.on('connection', conn => {
        conn.on('data', data => {
            peerUserName = data['userName']
            otherUserId = data['id']
        })
    })

    //when someone calls, we answer them and send our stream
    myPeer.on('call', call => {
        call.answer(stream)

        // when caller send its stream add it to receivers ui
        call.on('stream', userVideoStream => {
            peerVideo.srcObject = userVideoStream;
            peerName.innerHTML = peerUserName;
        })
        call.on('close', () => {
            peerVideo.parentElement.remove();
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


function connectToNewUser(userId, stream) {

    //make a connection to the new user and send your userName
    const conn = myPeer.connect(userId)
    let call
    conn.on('open', async() => {
        await conn.send({ id: myUserId, userName: myUserName });
        //call the new user and send your stream
        call = myPeer.call(userId, stream);

        //when receiver sends its stream add it to callers ui
        call.on('stream', userVideoStream => {
            peerVideo.srcObject = userVideoStream;
            peerName.innerHTML = peerUserName;
        })

        call.on('close', () => {
            peerVideo.parentElement.remove();
        })
    })

    peers[userId] = call
}

let captureStream = null;

shareScreenBtn.addEventListener('click', () => {
    if (captureStream != null) {
        captureStream.getVideoTracks().forEach(t => {
            if (t.enabled) {
                shareScreenBtn.innerHTML = 'Share Screen'
                myPeer.call(otherUserId, myStream);
            } else {
                shareScreenBtn.innerHTML = 'Stop Share'
            }
            t.enabled = !t.enabled;
        });
    } else {
        shareScreen();
        shareScreenBtn.innerHTML = 'Stop Share';
    }
})

async function shareScreen() {
    captureStream = await navigator.mediaDevices.getDisplayMedia();

    //if user clicks on 'Stop sharing' button given by browser then this will run
    captureStream.getVideoTracks()[0].onended = () => {
        shareScreenBtn.innerHTML = 'Stop Share';
        captureStream = null;
        myPeer.call(otherUserId, myStream);
    }
    myPeer.call(otherUserId, captureStream);
};