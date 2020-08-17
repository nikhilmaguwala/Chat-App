const socket = io()

//Elements
const $msgForm = document.querySelector('#messageForm')
const $msgInput = document.querySelector('input')
const $msgButton = document.querySelector('button') 
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username , room } = Qs.parse(location.search,{ ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of Messages Container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    const scrolloffset  = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrolloffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message' , (msg)=> {
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        msg:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll()
})

socket.on('locationMessage',(url) => {
    const html = Mustache.render(locationTemplate,{
        username:url.username,
        url:url.text,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll()   
})

socket.on('roomData',({room,users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML  = html
})

$msgForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $msgButton.setAttribute('disabled','true')
    const message  = e.target.elements.message.value

    socket.emit('sendMessage',message,(error) => {
        $msgButton.removeAttribute('disabled')
        $msgInput.value=""
        $msgInput.focus()
        if(error){
            return console.log(error);
        }else{
            console.log('Message Delivered!');
        }
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled','true')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },() => {
            $locationButton.removeAttribute('disabled')
            console.log("Location Shared");
        })
    })
})

socket.emit('join', { username ,room},(error) => {
    if(error){
        alert(error)
        location.href='/'
    }
})