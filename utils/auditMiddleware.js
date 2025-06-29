const auditLogger = require('./auditLogger');

// Middleware to log all API requests
const auditRequestMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original send method
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send method to capture response
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
    
    // Log the request asynchronously (don't block response)
    setImmediate(() => {
      auditLogger.logApiRequest(req, res, duration, status);
    });
    
    return originalSend.call(this, data);
  };
  
  // Override json method to capture response
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
    
    // Log the request asynchronously (don't block response)
    setImmediate(() => {
      auditLogger.logApiRequest(req, res, duration, status);
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware to log authentication events
const auditAuthMiddleware = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let user = null;
      let error = null;
      
      try {
        const responseData = JSON.parse(data);
        if (responseData.data && responseData.data.user) {
          user = responseData.data.user;
        }
        if (responseData.error) {
          error = new Error(responseData.error);
        }
      } catch (e) {
        // Response is not JSON, ignore
      }
      
      // Log authentication event asynchronously
      setImmediate(() => {
        auditLogger.logAuth(action, user, req, status, error);
      });
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let user = null;
      let error = null;
      
      if (data.data && data.data.user) {
        user = data.data.user;
      }
      if (data.error) {
        error = new Error(data.error);
      }
      
      // Log authentication event asynchronously
      setImmediate(() => {
        auditLogger.logAuth(action, user, req, status, error);
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware to log CRUD operations
const auditCrudMiddleware = (action, resourceType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let resource = null;
      let oldData = null;
      let newData = null;
      
      try {
        const responseData = JSON.parse(data);
        if (responseData.data) {
          resource = responseData.data;
          newData = responseData.data;
        }
      } catch (e) {
        // Response is not JSON, ignore
      }
      
      // Log CRUD operation asynchronously
      setImmediate(() => {
        switch (resourceType) {
          case 'USER':
            auditLogger.logUserAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'LAND':
            auditLogger.logLandAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'LISTING':
            auditLogger.logListingAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'TRANSACTION':
            auditLogger.logTransactionAction(action, req.user, resource, req, oldData, newData);
            break;
        }
      });
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let resource = null;
      let oldData = null;
      let newData = null;
      
      if (data.data) {
        resource = data.data;
        newData = data.data;
      }
      
      // Log CRUD operation asynchronously
      setImmediate(() => {
        switch (resourceType) {
          case 'USER':
            auditLogger.logUserAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'LAND':
            auditLogger.logLandAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'LISTING':
            auditLogger.logListingAction(action, req.user, resource, req, oldData, newData);
            break;
          case 'TRANSACTION':
            auditLogger.logTransactionAction(action, req.user, resource, req, oldData, newData);
            break;
        }
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware to log file operations
const auditFileMiddleware = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let error = null;
      
      try {
        const responseData = JSON.parse(data);
        if (responseData.error) {
          error = new Error(responseData.error);
        }
      } catch (e) {
        // Response is not JSON, ignore
      }
      
      // Log file operation asynchronously
      setImmediate(() => {
        auditLogger.logFileAction(action, req.user, req.file, req, status, error);
      });
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let error = null;
      
      if (data.error) {
        error = new Error(data.error);
      }
      
      // Log file operation asynchronously
      setImmediate(() => {
        auditLogger.logFileAction(action, req.user, req.file, req, status, error);
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware to log security events
const auditSecurityMiddleware = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let details = {};
      
      try {
        const responseData = JSON.parse(data);
        if (responseData.error) {
          details.error = responseData.error;
        }
        if (responseData.message) {
          details.message = responseData.message;
        }
      } catch (e) {
        // Response is not JSON, ignore
      }
      
      // Log security event asynchronously
      setImmediate(() => {
        auditLogger.logSecurityEvent(action, req.user, req, details);
      });
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';
      let details = {};
      
      if (data.error) {
        details.error = data.error;
      }
      if (data.message) {
        details.message = data.message;
      }
      
      // Log security event asynchronously
      setImmediate(() => {
        auditLogger.logSecurityEvent(action, req.user, req, details);
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Error logging middleware
const auditErrorMiddleware = (err, req, res, next) => {
  // Log error asynchronously
  setImmediate(() => {
    auditLogger.logError('API_ERROR', req.user, req, err, 'HIGH');
  });
  
  next(err);
};

// System event logging
const logSystemEvent = (action, details = {}) => {
  auditLogger.logSystemAction(action, details);
};

// Session event logging
const logSessionEvent = (action, user, req, details = {}) => {
  auditLogger.log({
    action,
    userId: user?._id,
    userEmail: user?.email,
    userRole: user?.role,
    sessionId: req?.session?.id,
    resourceType: 'SESSION',
    method: req?.method,
    endpoint: req?.originalUrl,
    ipAddress: auditLogger.getClientIP(req),
    userAgent: req?.get('User-Agent'),
    status: 'SUCCESS',
    priority: 'MEDIUM',
    metadata: details
  });
};

module.exports = {
  auditRequestMiddleware,
  auditAuthMiddleware,
  auditCrudMiddleware,
  auditFileMiddleware,
  auditSecurityMiddleware,
  auditErrorMiddleware,
  logSystemEvent,
  logSessionEvent
}; 