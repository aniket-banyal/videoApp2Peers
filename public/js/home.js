const form = document.querySelector("#form");
const newMeetingBtn = document.querySelector("#newMeetingBtn");
const joinMeetingBtn = document.querySelector("#joinMeetingBtn");
const nameInp = document.querySelector("#nameInp");
const roomInp = document.querySelector("#roomInp");

newMeetingBtn.addEventListener('click', () => {
    roomInp.value = ROOM_ID;
    form.action = ROOM_ID;
})

joinMeetingBtn.addEventListener('click', () => {
    form.action = roomInp.value;
})

let isName = false;
nameInp.oninput = () => {
    if (nameInp.value !== '') {
        newMeetingBtn.disabled = false;
        isName = true;
    } else if (nameInp.value == '') {
        newMeetingBtn.disabled = true;
        isName = false;
    }


    if (roomInp.value !== '' && isName && roomInp.value.length == 5) {
        joinMeetingBtn.disabled = false;
    } else if (roomInp.value == '' || !isName || roomInp.value.length !== 5) {
        joinMeetingBtn.disabled = true;
    }

}


roomInp.oninput = () => {
    if (roomInp.value !== '' && isName && roomInp.value.length == 5) {
        joinMeetingBtn.disabled = false;
    } else if (roomInp.value == '' || !isName || roomInp.value.length !== 5) {
        joinMeetingBtn.disabled = true;
    }
}

form.addEventListener('submit', (e) => {
    if (nameInp.value === '') {}
});