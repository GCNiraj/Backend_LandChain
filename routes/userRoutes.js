const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')
const router = express.Router()

router.post('/signup', authController.signup)
router.post('/signin', authController.signin)
router.get('/signout',authController.signout)
router.patch('/updateMyPassword',authController.protect,authController.updatePassword)
router.patch('/updateMe',authController.protect,userController.uploadUserPhoto,userController.updateMe)

// Session management routes
router.get('/session-info', authController.getSessionInfo);
router.patch('/session-preferences', authController.requireSession, authController.updateSessionPreferences);
router.get('/session-stats', authController.protect, authController.restrictTo('admin'), authController.getSessionStats);
router.delete('/force-logout/:userId', authController.protect, authController.restrictTo('admin'), authController.forceLogoutUser);
router.get('/user-sessions/:userId', authController.protect, authController.restrictTo('admin'), authController.getUserSessions);

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router