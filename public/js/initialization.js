const socket = io('/')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

const ONE_MB = 1000000

const peers = {}

let connection

const videoGrid = document.querySelector('#videoGrid')

const openChatBtn = document.querySelector('#openChatBtn')
const closeChatBtn = document.querySelector('#chatWindow a')
const chatWindow = document.querySelector('#chatWindow')
const chats = document.querySelector('#chats')
const chatInput = document.querySelector('#chatInput')
const sendMsgBtn = document.querySelector('#sendMsgBtn')
const notificationBubble = document.querySelector('.notificationBubble')
let chatOpen = false

let notificationCount = 0

const myVideo = document.querySelector('#myVideo video')
const myName = document.querySelector('#myVideo .name')
let myUserId
let myStream
let myVideoOn = false
let sharingScreen = false

const peerVideo = document.querySelector('#peerVideo video')
const peerName = document.querySelector('#peerVideo .name')
const peerNameFallback = document.querySelector('#peerVideo h1')
let peerUserId
let peerUserName
let peerSharingScreen = false

const videoBtn = document.querySelector('#videoBtn')
const audioBtn = document.querySelector('#audioBtn')
let audioOn = true

const shareScreenBtn = document.querySelector('#shareScreenBtn')
let captureStream

const shareFileBtn = document.querySelector('#shareFileBtn')
const selectFileDialog = document.querySelector('#selectFileDialog')
const selectFileInput = document.querySelector('#selectFileInput')
const shareFileOkBtn = document.querySelector('#shareFileOkBtn')

let file

const fileShareStatusDialog = document.querySelector('#fileShareStatusDialog')
const fileShareStatus = document.querySelector('#fileShareStatus')

const fileRequestDialog = document.querySelector('#fileRequestDialog')
const fileRequestMsg = document.querySelector('#fileRequestMsg')
const fileRequestAcceptBtn = document.querySelector('#fileRequestAcceptBtn')

let whiteboardOn = false
const whiteboardBtn = document.querySelector('#whiteboardBtn')
const canvas = document.querySelector('.whiteboard')
const context = canvas.getContext('2d')
let drawing = false
let current = { color: 'black' }

const url_string = window.location.href
const url = new URL(url_string)
const myUserName = url.searchParams.get("user")