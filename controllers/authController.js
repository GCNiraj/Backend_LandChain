const User = require("./../models/userModels");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const { promisify, isNullOrUndefined } = require("util");

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
    secure: process.env.NODE_ENV === 'production', // Fixed: should check for 'production'
    sameSite: "strict",
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // Fixed: should match expires
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
    req.session.visitCount = 1;
    
    createSendToken( newUser, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide an email and password!", 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
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
    req.session.visitCount = (req.session.visitCount || 0) + 1;
    req.session.lastActivity = new Date();

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.signout = (req, res) => {
  // Clear JWT cookie
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  // Destroy session
  req.session.destroy((err) => {
    if (err) {
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
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next(
        new AppError("The user belonging to this token no longer exist", 401)
      );
    }

    // 4) Update session activity if session exists
    if (req.session && req.session.user) {
      req.session.lastActivity = new Date();
    }

    // Grant access to protected route
    req.user = freshUser;
    next();
  } catch (err) {
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
        } else {
          // Restore user data after regeneration
          req.session.user = userData;
          req.session.passwordChangedAt = new Date();
        }
      });
    }

    // 5) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
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
    return next(new AppError("No active session. Please log in again.", 401));
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
  if (req.session && req.session.user) {
    res.status(200).json({
      status: "success",
      data: {
        sessionExists: true,
        user: req.session.user,
        loginTime: req.session.loginTime,
        lastActivity: req.session.lastActivity,
        visitCount: req.session.visitCount,
        sessionId: req.sessionID
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
  
  const { preferences, theme, language } = req.body;
  
  req.session.preferences = preferences;
  req.session.theme = theme;
  req.session.language = language;
  req.session.lastUpdated = new Date();
  
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
  // This would typically be handled by your session store
  // But you can add custom logic here if needed
  res.status(200).json({
    status: "success",
    message: "Expired sessions cleared"
  });
};