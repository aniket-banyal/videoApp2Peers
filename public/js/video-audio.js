function toggleVideo() {
    if (myStream.getVideoTracks().length > 0) {

        myStream.getVideoTracks().forEach(t => {
            if (t.enabled) {
                t.stop()
                if (connection) connection.send('noVideo')
                videoBtn.innerHTML = 'Show Video'
                myVideoOn = false
            } else startVideo()

            t.enabled = !t.enabled
        })
    } else startVideo()
}

function startVideo() {
    navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            myStream = stream
            myVideo.srcObject = myStream
            myPeer.call(peerUserId, myStream)

            if (connection) connection.send('video')

            videoBtn.innerHTML = 'Hide Video'
            myVideoOn = true
        })
        .catch(e => {
            console.log(e, 'Please allow video')
        })
}

function stopMyVideo() {
    myStream.getVideoTracks().forEach(t => {
        t.stop()
    })
}

function toggleAudio() {
    myStream.getAudioTracks().forEach(t => {
        t.enabled ? audioBtn.innerHTML = 'Start Mic' : audioBtn.innerHTML = 'Stop Mic'
        t.enabled = !t.enabled
    })
}

async function showVideoIfOn() {
    if (myVideoOn) {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        myVideo.srcObject = myStream
        myPeer.call(peerUserId, myStream)
    } else connection.send('noVideo')
}