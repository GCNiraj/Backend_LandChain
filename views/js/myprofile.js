import { showAlert } from './alert.js'

var obj = JSON.parse(document.cookie.substring(6))

var el = document.querySelector('.admin-nav')

if (obj.role == 'admin') {
    el.innerHTML = '<h5 class="admin-nav__heading">Admin</h5><ul class="side-nav"><a href="#"><svg><use xlink:href="images/icons.svg#icon-users"></use></svg>Manage users</a></li> <li><a href="#"><svg><use xlink:href="images/icons.svg#icon-star"></use></svg>Manage News</a></li><li><a href="#"><svg><use xlink:href="images/icons.svg#icon-briefcase"></use></svg>Manage E-Services</a></li></ul>'
}
else if (obj.role == 'sme') {
    el.innerHTML = '<h5 class="admin-nav__heading">Subject Matter Expert</h5><ul class="side-nav"><li><a href="#"><svg><use xlink:href="images/icons.svg#icon-star"></use></svg>Manage News</a></li></ul>'
} 
else if (obj.role == 'pharmacist') {
    el.innerHTML = '<h5 class="admin-nav__heading">Pharmacist</h5><ul class="side-nav"><li><a href="#"><svg><use xlink:href="images/icons.svg#icon-star"></use></svg>Manage E-Services</a></li></ul>'
}
else {
    el.innerHTML = '<h5 class="admin-nav__heading">User</h5><ul class="side-nav"><a href="#"><svg><use xlink:href="images/icons.svg#icon-users"></use></svg>Manage Medical Reminder</a></li> <li><a href="#"><svg><use xlink:href="images/icons.svg#icon-briefcase"></use></svg>Manage E-Services</a></li></ul>'
}

var el1 = document.querySelector('.form.form-user-data')

el1.innerHTML = ` <div class="form__group"> <label class="form__label" for="name">Name</label> <input class="form__input" id="name" type="text" value="` + obj.name.toUpperCase() + `" required="required" name="name"/></div><div class="form__group ma-bt-md"><label class="form__label" for="email">Email address</label><input class="form__input" id="email" type="email" value="` +obj.email +`" required="required" name="email"/></div><div class="form__group form__photo-upload"><img class="form__user-photo" src="../images/users/` +obj.photo +`" alt="User photo"/><input class="form__upload" type="file" accept="image/*" id="photo" name="photo"/><label for="photo">Choose new photo</label></div><div class "form__group right"> <button class="btn btn--small btn--green">Save settings</button></div>`

var el2 = document.querySelector('form.form-user-password')
el2.innerHTML = ` <div class="form__group"><label class="form__label" for="password-current">Current password</label><input class="form__input" id="password-current" type="password" placeholder="••••••••" required="required" minlength="8" /></div><div class="form__group"><label class="form__label" for="password">New password</label><input class="form__input" id="password" type="password" placeholder="••••••••" required="required" minlength="8" /></div><div class="form__group ma-bt-lg"><label class="form__label" for="password-confirm">Confirm password</label><input class="form__input" id="password-confirm" type="password" placeholder="••••••••" required="required" minlength="8" /></div><div class="form__group right"><button class="btn btn--small btn--green btn--save-password">Save password</button></div>`

//Updating settings
// type is either 'password' or data
export const updateSettings = async (data, type) => {
    try {
        const url =
            type === 'password'
            ? 'http://localhost:4001/api/v1/users/updateMyPassword'
            : 'http://localhost:4001/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url,
            data,
        })
        console.log(res.data.status)
        if (res.data.status === 'success') {
            showAlert('success', 'Data updated successfully!')
        }
    } catch (err) {
        let message =
            typeof err.response !== 'undefined'
                ? err.response.data.message
                : err.message
            // showAlert('error', 'Error: Please provide valid email address',message)
        showAlert('error', err.response.data.message)
    }
}

const userDataForm = document.querySelector('.form.form-user-data')
userDataForm.addEventListener('submit', (e) => {
    e.preventDefault()
    var obj = JSON.parse(document.cookie.substring(6))
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)
    form.append('photo', document.getElementById('photo').files[0])
    form.append('userId', obj._id)
    console.log(form)
    updateSettings(form, 'data')
})

const userPasswordForm = document.querySelector('form.form-user-password')
userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    document.querySelector('.btn--save-password').textContent = 'Updating...'
    const passwordCurrent = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        'password',
    )
    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
})