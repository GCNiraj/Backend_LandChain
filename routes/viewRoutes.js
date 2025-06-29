const express = require('express')
const router = express.Router()
const viewsController = require('./../controllers/viewController')
const authController = require('./../controllers/authController')

router.get('/', viewsController.getHome)
router.get('/login', viewsController.getLoginForm)
router.get('/signup', viewsController.getSignupForm)
router.get('/me',authController.requireBothAuth,viewsController.getProfile)

module.exports = router