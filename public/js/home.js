const newMeetingBtn = document.querySelector("#newMeetingBtn");
const nameInp = document.querySelector("#nameInp");

nameInp.oninput = () => {
    nameInp.value !== '' ? newMeetingBtn.disabled = false : newMeetingBtn.disabled = true
}