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
        peerVideo.parentElement.style.opacity = 1
    })

    connection.on('data', data => {
        handleConnectionData(data)
    })

    peers[userId] = call
}

function handleConnectionData(data) {
    if (data == 'noVideo') {

        peerVideo.style.opacity = 0
        peerName.style.opacity = 0
        peerNameFallback.style.opacity = 1
        peerNameFallback.parentElement.style.background = '#5a5a5a'

    } else if (data == 'video') {

        peerVideo.style.opacity = 1
        peerName.style.opacity = 1
        peerNameFallback.style.opacity = 0
        peerNameFallback.parentElement.style.background = 'none'

    } else if (data == 'sharingScreen') {

        peerSharingScreen = true
        videoBtn.disabled = true
        shareScreenBtn.disabled = true
        whiteboardBtn.disabled = true
        peerVideo.style.opacity = 1
        peerNameFallback.style.opacity = 0
        peerName.style.opacity = 1
        peerNameFallback.parentElement.style.background = ''
        myVideo.parentElement.style.opacity = 0
            //need to make display none or it'll still take up space
        myVideo.parentElement.style.display = 'none'
        videoGrid.style.gridTemplateColumns = '1fr'
        peerVideo.style.maxHeight = '100%'
            //stop my video if other user is sharing screen
        stopMyVideo()

    } else if (data == 'screenShareStopped') {

        peerSharingScreen = false
        videoBtn.disabled = false
        shareScreenBtn.disabled = false
        whiteboardBtn.disabled = false
        videoGrid.style.gridTemplateColumns = '3fr 1fr'
        peerVideo.style.maxHeight = '85vh'

        //after the other user has stopped sharing screen, turn on my video if it was on before sharing began
        if (myVideoOn) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: audioOn
            }).then(stream => {
                myStream = stream
                myVideo.srcObject = myStream
                myPeer.call(peerUserId, myStream)
                connection.send('video')
            })
        }
        //this should come after the above if, otherwise if peer's video was originally off and he turns off
        //screen share and then turns on his video then u'll see the last frame of screen share
        myVideo.parentElement.style.opacity = 1
        myVideo.parentElement.style.display = ''


    } else if (data.hasOwnProperty('id') && data.hasOwnProperty('userName')) {

        peerUserName = data['userName']
        peerUserId = data['id']
        peerName.innerHTML = peerNameFallback.innerHTML = peerUserName

    } else if (data.hasOwnProperty('name') && data.hasOwnProperty('size')) {

        let size

        if (data.size < ONE_MB / 10) size = data.size + ' KB'
        else size = (data.size / ONE_MB).toFixed(2) + ' MB'

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

        const blob = new Blob([data['file']])
        downloadFile(blob, data['name'])

    } else if (data.hasOwnProperty('msg')) {

        createMsg('peerMsg', data['msg'])
        if (!chatOpen) {
            notificationCount++
            notificationBubble.innerHTML = notificationCount
        }

    } else if (data == 'whiteboardOn') {

        window.addEventListener('resize', onResize, false)
        context.clearRect(0, 0, canvas.width, canvas.height)
        canvas.style.display = ''
        videoGrid.style.opacity = 0
        videoBtn.disabled = true
        shareScreenBtn.disabled = true
        whiteboardBtn.disabled = true
            //stop my video if other user is sharing whiteboard
        stopMyVideo()

    } else if (data == 'whiteboardOff') {

        canvas.style.display = 'none'
        videoGrid.style.opacity = 1
        videoBtn.disabled = false
        shareScreenBtn.disabled = false
        whiteboardBtn.disabled = false
            //after the other user has stopped sharing whiteboard, turn on my video if it was on before sharing began
        if (myVideoOn) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: audioOn
            }).then(stream => {
                myStream = stream
                myVideo.srcObject = myStream
                myPeer.call(peerUserId, myStream)
                connection.send('video')
            })
        }

    } else if (data.hasOwnProperty('x0')) {
        onDrawingEvent(data)
    }
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

function onPeerDisconnect() {
    peerVideo.style.opacity = 0
    peerName.innerHTML = ''
    peerVideo.parentElement.style.opacity = 0
    peerNameFallback.innerHTML = ''

    sendMsgBtn.disabled = true
    shareScreenBtn.disabled = true
    shareFileBtn.disabled = true
    whiteboardBtn.disabled = true

    connection = null
}