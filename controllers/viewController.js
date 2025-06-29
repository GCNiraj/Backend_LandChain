const path = require('path')

/* LOG IN PAGE */
exports.getLoginForm = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'login.html'))
}

/* SIGN UP PAGE */
exports.getSignupForm = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'signup.html'))
}

/* HOME PAGE */
exports.getHome = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'dashboard.html'))
}

/* Profile Page */
exports.getProfile = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'myprofilepage.html'))
}