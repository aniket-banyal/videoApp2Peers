function createMsg(type, text) {
    const div = document.createElement('div')
    div.classList.add(type)

    const p = document.createElement('p')
    const pTime = document.createElement('p')
    pTime.classList.add('time')
    pTime.innerHTML = new Date().toLocaleTimeString(['en-GB'], { hour: '2-digit', minute: '2-digit' })
    p.innerHTML = text

    div.append(p)
    div.append(pTime)
    chats.append(div)

    chats.scrollTop = chats.scrollHeight
}