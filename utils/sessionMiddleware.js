const SessionUtils = require('./sessionUtils');

// Session monitoring middleware
const sessionMonitor = (req, res, next) => {
  if (req.session && req.session.user) {
    // Check if session is about to expire
    if (SessionUtils.isSessionExpiringSoon(req.session)) {
      // Add warning header
      res.set('X-Session-Warning', 'Session expiring soon');
    }
    
    // Update session activity
    SessionUtils.updateSessionActivity(req.session);
  }
  next();
};

// Session health check middleware
const sessionHealthCheck = (req, res, next) => {
  if (req.session && req.session.user) {
    // Validate session data structure
    if (!SessionUtils.validateSessionData(req.session)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid session data structure'
      });
    }
  }
  next();
};

// Rate limiting based on session
const sessionRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const sessionId = req.sessionID;
    const now = Date.now();
    
    if (!sessionId) {
      return next();
    }
    
    const userRequests = requests.get(sessionId) || [];
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests from this session'
      });
    }
    
    validRequests.push(now);
    requests.set(sessionId, validRequests);
    
    // Clean up old entries
    setTimeout(() => {
      requests.delete(sessionId);
    }, windowMs);
    
    next();
  };
};

// Session activity logging middleware
const sessionActivityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    if (req.session && req.session.user) {
      const duration = Date.now() - startTime;
      console.log(`Session Activity - User: ${req.session.user.email}, Route: ${req.method} ${req.path}, Duration: ${duration}ms, Status: ${res.statusCode}`);
    }
  });
  
  next();
};

module.exports = {
  sessionMonitor,
  sessionHealthCheck,
  sessionRateLimit,
  sessionActivityLogger
}; 