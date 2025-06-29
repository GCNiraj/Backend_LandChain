const express = require("express")
const path = require('path')
const app = express()
const cookieParser = require('cookie-parser')
const session = require('express-session')

const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})

const userRouter = require('./routes/userRoutes')
const landRouter = require('./routes/landMetadataRoutes')
const listingRouter = require('./routes/listingRoutes')
const transctionRouter = require('./routes/transactionRoutes')
const viewRouter = require('./routes/viewRoutes')

app.use(express.static(path.join(__dirname, 'views')))
app.use(cookieParser())
app.use(express.json())

// Express Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV,
        httpOnly: true,
        maxAge: 60*60*1000,
        sameSite: 'strict'
    }
}));
// End of express session


app.use('/api/v1/users',userRouter)
app.use('/api/v1/land',landRouter)
app.use('/api/v1/listing',listingRouter)
app.use('/api/v1/transaction',transctionRouter)
app.use('/', viewRouter)

module.exports = app