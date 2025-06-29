# Session Implementation Documentation

## Overview
This application implements a robust session management system using Express.js sessions with MongoDB storage. The implementation includes both JWT tokens and server-side sessions for enhanced security and user experience.

## Features

### ✅ Implemented Features
- **MongoDB Session Store**: Persistent session storage using `connect-mongo`
- **Session Validation**: Automatic validation of session data and expiration
- **Session Monitoring**: Real-time monitoring of session health and activity
- **Admin Controls**: Admin-only session management functions
- **Security Features**: Session regeneration on password change, secure cookies
- **Activity Tracking**: User visit counts and last activity timestamps

### 🔧 Configuration

#### Environment Variables (`config.env`)
```env
SESSION_SECRET = thissesaisusedforlandlockchain
NODE_ENV = development
```

#### Session Configuration (`app.js`)
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE.replace('PASSWORD', process.env.DATABASE_PASSWORD),
        ttl: 60 * 60, // 1 hour
        autoRemove: 'native',
        touchAfter: 24 * 3600
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'strict'
    },
    rolling: true,
    unset: 'destroy'
}));
```

## Session Data Structure

### User Session Object
```javascript
{
    user: {
        id: "user_id",
        email: "user@example.com",
        name: "User Name",
        role: "user_role"
    },
    loginTime: Date,
    lastActivity: Date,
    visitCount: Number,
    signupTime: Date, // for new users
    isNewUser: Boolean,
    preferences: Object, // optional
    theme: String, // optional
    language: String // optional
}
```

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/users/signup` - Create new user and session
- `POST /api/v1/users/signin` - Login and create session
- `GET /api/v1/users/signout` - Logout and destroy session

### Session Management Endpoints
- `GET /api/v1/users/session-info` - Get current session information
- `PATCH /api/v1/users/session-preferences` - Update session preferences
- `GET /api/v1/users/session-stats` - Get session statistics (admin only)
- `DELETE /api/v1/users/force-logout/:userId` - Force logout user (admin only)
- `GET /api/v1/users/user-sessions/:userId` - Get user sessions (admin only)

## Middleware Functions

### Authentication Middleware
- `authController.protect` - JWT-based authentication
- `authController.requireSession` - Session-based authentication
- `authController.requireBothAuth` - Combined JWT + session authentication

### Session Monitoring Middleware
- `sessionMonitor` - Monitors session health and activity
- `sessionHealthCheck` - Validates session data structure
- `sessionActivityLogger` - Logs session activity

## Utility Functions

### SessionUtils Class
```javascript
// Get session statistics
SessionUtils.getSessionStats()

// Clean up expired sessions
SessionUtils.cleanupExpiredSessions()

// Get user sessions
SessionUtils.getUserSessions(userId)

// Force logout user
SessionUtils.forceLogoutUser(userId)

// Validate session data
SessionUtils.validateSessionData(session)

// Create session data
SessionUtils.createSessionData(user)

// Update session activity
SessionUtils.updateSessionActivity(session)

// Check if session is expiring soon
SessionUtils.isSessionExpiringSoon(session)
```

## Security Features

### Session Security
- **Secure Cookies**: Only sent over HTTPS in production
- **HttpOnly**: Prevents XSS attacks
- **SameSite**: Prevents CSRF attacks
- **Session Regeneration**: On password change for security
- **Automatic Cleanup**: Expired sessions are automatically removed

### Session Validation
- **Data Structure Validation**: Ensures required fields exist
- **Expiration Checking**: Validates session hasn't expired
- **Activity Tracking**: Monitors user activity and session health

## Usage Examples

### Creating a Session
```javascript
// On user signup/signin
req.session.user = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role
};
req.session.loginTime = new Date();
req.session.lastActivity = new Date();
req.session.visitCount = 1;
```

### Checking Session
```javascript
// In middleware
if (req.session && req.session.user) {
    // Session exists and is valid
    req.session.lastActivity = new Date();
}
```

### Destroying Session
```javascript
// On logout
req.session.destroy((err) => {
    if (err) {
        console.error('Session destruction error:', err);
    }
    // Session destroyed
});
```

## Monitoring and Maintenance

### Session Statistics
```javascript
// Get session stats
const stats = await SessionUtils.getSessionStats();
// Returns: { total: 100, active: 85, expired: 15 }
```

### Manual Cleanup
```javascript
// Clean up expired sessions
const result = await SessionUtils.cleanupExpiredSessions();
// Returns: { deletedCount: 15, message: "Cleaned up 15 expired sessions" }
```

### Admin Functions
```javascript
// Force logout user from all sessions
const result = await SessionUtils.forceLogoutUser(userId);

// Get all sessions for a user
const sessions = await SessionUtils.getUserSessions(userId);
```

## Best Practices

### Development
1. **Environment Configuration**: Always set proper `NODE_ENV` and `SESSION_SECRET`
2. **Session Validation**: Use session validation middleware on protected routes
3. **Error Handling**: Implement proper error handling for session operations
4. **Logging**: Use session activity logging for debugging

### Production
1. **Secure Configuration**: Ensure `secure: true` for cookies in production
2. **Session Store**: Use persistent session storage (MongoDB)
3. **Monitoring**: Implement session monitoring and alerting
4. **Cleanup**: Set up automatic session cleanup
5. **Rate Limiting**: Implement session-based rate limiting

## Troubleshooting

### Common Issues
1. **Session Not Persisting**: Check MongoDB connection and session store configuration
2. **Session Expiring Too Soon**: Verify `maxAge` and `ttl` settings
3. **Session Validation Errors**: Check session data structure and required fields
4. **Memory Leaks**: Ensure proper session cleanup and monitoring

### Debugging
1. **Check Session Info**: Use `/api/v1/users/session-info` endpoint
2. **Monitor Logs**: Check session activity logs
3. **Database Queries**: Query sessions collection directly in MongoDB
4. **Session Stats**: Use admin endpoints to get session statistics

## Dependencies
- `express-session`: Core session middleware
- `connect-mongo`: MongoDB session store
- `mongoose`: MongoDB connection and queries
- `cookie-parser`: Cookie parsing middleware

## Files Structure
```
├── app.js                          # Main app configuration with session setup
├── controllers/
│   └── authController.js           # Session management controllers
├── routes/
│   └── userRoutes.js               # Session-related routes
├── utils/
│   ├── sessionUtils.js             # Session utility functions
│   └── sessionMiddleware.js        # Session monitoring middleware
└── config.env                      # Environment configuration
``` 