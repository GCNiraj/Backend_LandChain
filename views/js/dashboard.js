import { showAlert } from './alert.js'

// Logging Out
const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url : 'http://localhost:4001/api/v1/users/logout',
        })
        if (res.data.status === 'success') {
            location.reload(true)
        }
    } catch (err) {
        showAlert('error', 'Error logging out! Try again.')
    }
}

var obj 
if (document.cookie) {
    obj = JSON.parse(document.cookie.substring(6));
} else {
    obj = JSON.parse('{}');
}

var el = document.querySelector('.nav.nav--user')

if (obj._id) {
    el.innerHTML = 
    '<a id= "logout" class="nav__el">Log out</a> <a href="/me" class="nav__el"><img src="../images/users/'+obj.photo+'" alt="Photo of ${user.name}" class="nav__user-img"/><span>' + obj.name + '</span></a>'
    var doc = document.querySelector('#logout')

    doc.addEventListener('click',(e)=> logout())
}else {
    el.innerHTML = '<a class="nav__el nav__el--cta" href="/login">Log in</a> <a class="nav__el nav__el--cta" href="/signup">Sign up</a>'
}

const allNews = async() => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:4001/api/v1/news',
        })
        displayNews(res.data)
    } catch (err) {
        console.log(err)
    }
}
allNews()

const displayNews = (news) => {
    var arr = news.data.news1
    console.log(arr)
    for (let i=0; i<arr.length; i++){
        var card = document.querySelector('.card').cloneNode(true)
        var el1 = card.querySelector('.card__picture-img')
        var el2 = card.querySelector('.card__sub-heading')
        var el3 = card.querySelector('.card__text')
        var el4 = card.querySelector('.publishedAt')
        var el5 = card.querySelector('.publishedBy')
        const element = arr[i]
        el1.innerHTML = ''+element.imageCover
        el2.innerHTML = ''+element.title
        el3.innerHTML = ''+element.description
        var d = new Date(element.publishedAt)
        el4.innerHTML = ''+d.toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
        })
        el5.innerHTML = ''+element.user.name
        var card2 = document.querySelector('.card')
        card2.insertAdjacentElement('afterend', card)
    }
    document.querySelector('.card').remove()
}