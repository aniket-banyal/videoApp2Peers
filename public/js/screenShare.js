function stopScreenShare() {
    captureStream.getTracks()[0].stop()

    sharingScreen = false

    connection.send('screenShareStopped')

    shareScreenBtn.innerHTML = 'Share Screen'

    videoBtn.disabled = false
    whiteboardBtn.disabled = false

    showVideoIfOn()
}

async function shareScreen() {
    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia()

        sharingScreen = true

        await connection.send('sharingScreen')

        shareScreenBtn.innerHTML = 'Stop Share'

        myPeer.call(peerUserId, captureStream)

        //if user clicks on 'Stop sharing' button given by browser then this will run
        captureStream.getVideoTracks()[0].onended = () => {
            stopScreenShare()
            sharingScreen = false
        }

        //if I am sharing screen, disable my videoBtn and whiteBoardBtn
        videoBtn.disabled = true
        whiteboardBtn.disabled = true

        //If i start sharing screen, turn off my video
        stopMyVideo()

        //If i start sharing screen, peers video will be turned off so do this
        peerVideo.style.display = 'none'
        peerNameFallback.innerHTML = peerUserName
        peerNameFallback.parentElement.style.background = 'black'
        peerName.innerHTML = ''
    } catch (e) {
        console.log(e, 'Please select a screen to share')
    }
}