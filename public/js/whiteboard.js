function startWhiteboard() {
    onResize()

    whiteboardBtn.innerHTML = 'Stop Whiteboard'
    context.clearRect(0, 0, canvas.width, canvas.height)
    canvas.style.display = ''
    videoGrid.style.opacity = 0

    canvas.addEventListener('mousedown', onMouseDown, false)
    canvas.addEventListener('mouseup', onMouseUp, false)
    canvas.addEventListener('mouseout', onMouseUp, false)
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false)

    window.addEventListener('resize', onResize, false)

    connection.send('whiteboardOn')

    //if I am sharing whiteboard disable my videoBtn and shareScreenBtn
    videoBtn.disabled = true
    shareScreenBtn.disabled = true

    //If i start sharing whiteboard, turn off my video
    stopMyVideo()
}

function stopWhiteboard() {
    connection.send('whiteboardOff')
    whiteboardBtn.innerHTML = 'Whiteboard'
    videoBtn.disabled = false
    shareScreenBtn.disabled = false

    canvas.style.display = 'none'
    videoGrid.style.opacity = 1

    canvas.removeEventListener('mousedown', onMouseDown, false)
    canvas.removeEventListener('mouseup', onMouseUp, false)
    canvas.removeEventListener('mouseout', onMouseUp, false)
    canvas.removeEventListener('mousemove', throttle(onMouseMove, 10), false)

    window.removeEventListener('resize', onResize, false)
    showVideoIfOn()

}

function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath()
    context.moveTo(x0, y0)
    context.lineTo(x1, y1)
    context.strokeStyle = color
    context.lineWidth = 2
    context.stroke()
    context.closePath()

    if (!emit) return
    const w = canvas.width
    const h = canvas.height

    connection.send({
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color
    })
}

function onMouseDown(e) {
    drawing = true
    current.x = e.clientX
    current.y = e.clientY
}

function onMouseUp(e) {
    if (!drawing) return
    drawing = false
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true)
}

function onMouseMove(e) {
    if (!drawing) return
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true)
    current.x = e.clientX
    current.y = e.clientY
}

function throttle(callback, delay) {
    let previousCall = new Date().getTime()
    return function() {
        const time = new Date().getTime()

        if ((time - previousCall) >= delay) {
            previousCall = time
                //this is calling the onMouseMove function with e as argument
            callback.apply(null, arguments)
        }
    }
}

function onDrawingEvent(data) {
    onResize()

    const w = canvas.width
    const h = canvas.height
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color)
}

function onResize() {
    //create a temp canvas and draw the original canvas on it
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCanvasCtx = tempCanvas.getContext('2d')
    tempCanvasCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height)

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    //after resizing the original canvas, draw from the temp canvas
    context.drawImage(tempCanvas, 0, 0)
}