import { showAlert } from './alert.js'

export const signup = async (name, email , password, passwordConfirm, role) => {
    try {
        const res = await axios({
            method: "POST",
            url: 'http://localhost:4001/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
                role,
            },
        })
        
        if (res.data.status === 'success') {
            showAlert('success','Account created successfully!')
            window.setTimeout(() => {
                location.assign('/')
            }, 1500)
        }
    } catch (err) {
        let message = 
            typeof err.response !== 'undefined'
                ? err.response.data.message
                : err.message
        showAlert('error', 'Error: Passwords are not the same!',message)
    }
}

document.querySelector('.form').addEventListener('submit',(e)=>{
    e.preventDefault()
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('confirm_password').value
    const role = document.querySelector('input[name=role]:checked').value
    signup(name, email, password, passwordConfirm, role)
})