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
            audio: audioOn
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
    if (myStream.getAudioTracks().length > 0) {

        myStream.getAudioTracks().forEach(t => {
            t.enabled ? audioBtn.innerHTML = 'Unmute' : audioBtn.innerHTML = 'Mute'
            t.enabled = !t.enabled
            audioOn = !audioOn
        })
    } else startAudio()
}

function startAudio() {
    navigator.mediaDevices.getUserMedia({
            video: myVideoOn,
            audio: true
        }).then(stream => {
            myStream = stream
            myVideo.srcObject = myStream
            myPeer.call(peerUserId, myStream)

            audioBtn.innerHTML = 'Mute'
            audioOn = true
        })
        .catch(e => {
            console.log(e, 'Please allow microphone')
        })
}

async function showVideoIfOn() {
    if (myVideoOn) {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: audioOn
        })
        myVideo.srcObject = myStream
        myPeer.call(peerUserId, myStream)
    } else connection.send('noVideo')
}