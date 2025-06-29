const express = require("express")
const path = require('path')
const app = express()
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')

const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})

const userRouter = require('./routes/userRoutes')
const landRouter = require('./routes/landMetadataRoutes')
const listingRouter = require('./routes/listingRoutes')
const transctionRouter = require('./routes/transactionRoutes')
const viewRouter = require('./routes/viewRoutes')
const auditRouter = require('./routes/auditRoutes')

// Session monitoring middleware
const { sessionMonitor, sessionHealthCheck, sessionActivityLogger } = require('./utils/sessionMiddleware');

// Audit logging middleware
const { 
  auditRequestMiddleware, 
  auditErrorMiddleware,
  logSystemEvent 
} = require('./utils/auditMiddleware');

// Audit logger
const auditLogger = require('./utils/auditLogger');

app.use(express.static(path.join(__dirname, 'views')))
app.use(cookieParser())
app.use(express.json())

// Express Session with MongoDB Store
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE.replace('PASSWORD', process.env.DATABASE_PASSWORD),
        ttl: 60 * 60, // 1 hour in seconds
        autoRemove: 'native', // Enable automatic removal of expired sessions
        touchAfter: 24 * 3600 // Only update session once per day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
        sameSite: 'strict'
    },
    rolling: true, // Extend session on each request
    unset: 'destroy' // Destroy session when unset
}));

// Session monitoring middleware
app.use(sessionMonitor);
app.use(sessionHealthCheck);
app.use(sessionActivityLogger);

// Audit logging middleware for all API requests
app.use('/api', auditRequestMiddleware);

// Log system startup
logSystemEvent('SYSTEM_STARTUP', {
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV,
  port: 4001
});

// Routes
app.use('/api/v1/users',userRouter)
app.use('/api/v1/land',landRouter)
app.use('/api/v1/listing',listingRouter)
app.use('/api/v1/transaction',transctionRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/', viewRouter)

// Error logging middleware (must be last)
app.use(auditErrorMiddleware);

// Graceful shutdown
process.on('SIGINT', async () => {
  logSystemEvent('SYSTEM_SHUTDOWN', {
    timestamp: new Date().toISOString(),
    reason: 'SIGINT received'
  });
  
  await auditLogger.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logSystemEvent('SYSTEM_SHUTDOWN', {
    timestamp: new Date().toISOString(),
    reason: 'SIGTERM received'
  });
  
  await auditLogger.cleanup();
  process.exit(0);
});

module.exports = app