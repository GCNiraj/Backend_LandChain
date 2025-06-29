const User = require("./../models/userModels");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const { promisify, isNullOrUndefined } = require("util");
const auditLogger = require("../utils/auditLogger");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = ( user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24* 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  };
  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Session validation utility
const validateSession = (session) => {
  if (!session || !session.user) {
    return false;
  }
  
  // Check if session has expired (1 hour)
  const now = new Date();
  const lastActivity = new Date(session.lastActivity);
  const sessionAge = now - lastActivity;
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  return sessionAge < maxAge;
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    
    // Create session for new user
    req.session.user = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };
    req.session.signupTime = new Date();
    req.session.loginTime = new Date();
    req.session.lastActivity = new Date();
    req.session.visitCount = 1;
    req.session.isNewUser = true;
    
    // Save session explicitly
    req.session.save(async (err) => {
      if (err) {
        console.error('Session save error:', err);
        await auditLogger.logError('SESSION_CREATE', newUser, req, err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      // Log successful signup
      await auditLogger.logAuth('USER_SIGNUP', newUser, req, 'SUCCESS');
      createSendToken(newUser, 201, res);
    });
  } catch (err) {
    // Log signup error
    await auditLogger.logError('USER_SIGNUP', null, req, err);
    res.status(500).json({ error: err.message });
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
      await auditLogger.logSecurityEvent('LOGIN_ATTEMPT', null, req, {
        email,
        reason: 'Missing email or password'
      });
      return next(new AppError("Please provide an email and password!", 400));
    }
    
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      await auditLogger.logSecurityEvent('LOGIN_FAILED', null, req, {
        email,
        reason: 'Invalid credentials'
      });
      return next(new AppError("Incorrect email or password", 401));
    }

    // Store user data in session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Store additional session data
    req.session.loginTime = new Date();
    req.session.lastActivity = new Date();
    req.session.visitCount = (req.session.visitCount || 0) + 1;
    req.session.isNewUser = false;

    // Save session explicitly
    req.session.save(async (err) => {
      if (err) {
        console.error('Session save error:', err);
        await auditLogger.logError('SESSION_CREATE', user, req, err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      // Log successful signin
      await auditLogger.logAuth('USER_SIGNIN', user, req, 'SUCCESS');
      // 3) If everything ok, send token to client
      createSendToken(user, 200, res);
    });
  } catch (err) {
    await auditLogger.logError('USER_SIGNIN', null, req, err);
    res.status(500).json({ error: err.message });
  }
};

exports.signout = async (req, res) => {
  try {
    // Clear JWT cookie
    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    // Log signout before destroying session
    if (req.session && req.session.user) {
      await auditLogger.logAuth('USER_SIGNOUT', req.session.user, req, 'SUCCESS');
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        auditLogger.logError('SESSION_DESTROY', req.user, req, err);
        return res.status(500).json({ 
          status: "error", 
          message: "Could not log out properly" 
        });
      }
      
      res.status(200).json({ 
        status: "success",
        message: "Logged out successfully"
      });
    });
  } catch (err) {
    await auditLogger.logError('USER_SIGNOUT', req.user, req, err);
    res.status(500).json({ error: err.message });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      await auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, {
        reason: 'No token provided'
      });
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      await auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', null, req, {
        reason: 'User no longer exists',
        userId: decoded.id
      });
      return next(
        new AppError("The user belonging to this token no longer exist", 401)
      );
    }

    // 4) Validate and update session
    if (req.session && req.session.user) {
      if (!validateSession(req.session)) {
        // Session expired, destroy it
        await auditLogger.logAuth('SESSION_EXPIRE', freshUser, req, 'WARNING');
        req.session.destroy();
        return next(new AppError("Session expired. Please log in again.", 401));
      }
      req.session.lastActivity = new Date();
    }

    // Grant access to protected route
    req.user = freshUser;
    next();
  } catch (err) {
    await auditLogger.logError('PROTECT_MIDDLEWARE', req.user, req, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");
    // 2) Check if Posted current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      await auditLogger.logSecurityEvent('PASSWORD_CHANGE', req.user, req, {
        reason: 'Current password incorrect'
      });
      return next(new AppError("Your current password is wrong", 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Regenerate session for security after password change
    if (req.session) {
      const userData = req.session.user;
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          auditLogger.logError('SESSION_REGENERATE', req.user, req, err);
        } else {
          // Restore user data after regeneration
          req.session.user = userData;
          req.session.passwordChangedAt = new Date();
          req.session.lastActivity = new Date();
        }
      });
    }

    // Log password change
    await auditLogger.logAuth('PASSWORD_CHANGE', req.user, req, 'SUCCESS');

    // 5) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    await auditLogger.logError('PASSWORD_CHANGE', req.user, req, err);
    res.status(500).json({ error: err.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', req.user, req, {
        reason: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

// Middleware to check session
exports.requireSession = (req, res, next) => {
  if (!req.session) {
    auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', req.user, req, {
      reason: 'No active session'
    });
    return next(new AppError("No active session. Please log in again.", 401));
  }
  
  if (!validateSession(req.session)) {
    auditLogger.logAuth('SESSION_EXPIRE', req.user, req, 'WARNING');
    req.session.destroy();
    return next(new AppError("Session expired. Please log in again.", 401));
  }
  
  // Update last activity
  req.session.lastActivity = new Date();
  next();
};

// Combined middleware - requires both JWT and session
exports.requireBothAuth = async (req, res, next) => {
  // First check JWT
  await exports.protect(req, res, (err) => {
    if (err) return next(err);
    
    // Then check session
    exports.requireSession(req, res, next);
  });
};

// Get session information
exports.getSessionInfo = (req, res) => {
  if (req.session && req.session.user && validateSession(req.session)) {
    res.status(200).json({
      status: "success",
      data: {
        sessionExists: true,
        user: req.session.user,
        loginTime: req.session.loginTime,
        lastActivity: req.session.lastActivity,
        visitCount: req.session.visitCount,
        sessionId: req.sessionID,
        isNewUser: req.session.isNewUser || false
      }
    });
  } else {
    res.status(200).json({
      status: "success",
      data: {
        sessionExists: false
      }
    });
  }
};

// Update session preferences
exports.updateSessionPreferences = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next(new AppError("No active session", 401));
  }
  
  if (!validateSession(req.session)) {
    req.session.destroy();
    return next(new AppError("Session expired. Please log in again.", 401));
  }
  
  const { preferences, theme, language } = req.body;
  
  req.session.preferences = preferences;
  req.session.theme = theme;
  req.session.language = language;
  req.session.lastUpdated = new Date();
  req.session.lastActivity = new Date();
  
  res.status(200).json({
    status: "success",
    message: "Session preferences updated",
    data: {
      preferences: req.session.preferences,
      theme: req.session.theme,
      language: req.session.language
    }
  });
};

// Clear expired sessions (utility function)
exports.clearExpiredSessions = (req, res) => {
  // This is handled automatically by connect-mongo with autoRemove: 'native'
  res.status(200).json({
    status: "success",
    message: "Session cleanup is handled automatically by the session store"
  });
};

// Get all active sessions for a user (admin function)
exports.getUserSessions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const SessionUtils = require('../utils/sessionUtils');
    
    const sessions = await SessionUtils.getUserSessions(userId);
    
    res.status(200).json({
      status: "success",
      data: {
        userId,
        sessions,
        count: sessions.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get session statistics (admin function)
exports.getSessionStats = async (req, res, next) => {
  try {
    const SessionUtils = require('../utils/sessionUtils');
    const stats = await SessionUtils.getSessionStats();
    
    if (!stats) {
      return res.status(500).json({
        status: "error",
        message: "Failed to retrieve session statistics"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Force logout user from all sessions (admin function)
exports.forceLogoutUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const SessionUtils = require('../utils/sessionUtils');
    
    const result = await SessionUtils.forceLogoutUser(userId);
    
    // Log admin action
    await auditLogger.logSecurityEvent('USER_FORCE_LOGOUT', req.user, req, {
      targetUserId: userId,
      deletedSessions: result.deletedCount
    });
    
    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};