function downloadFile(blob, fileName) {
    const a = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
}


function shareFile() {
    if (file) {
        connection.send({ name: file.name, size: file.size })

        selectFileDialog.style.display = 'none'

        fileShareStatus.innerHTML = 'Sending....'
        fileShareStatusDialog.style.display = ''
    }
}