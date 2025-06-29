const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for system events
  },
  userEmail: {
    type: String,
    required: false
  },
  userRole: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },

  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'USER_SIGNUP', 'USER_SIGNIN', 'USER_SIGNOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
      'SESSION_CREATE', 'SESSION_DESTROY', 'SESSION_EXPIRE',
      
      // User management
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_PROFILE_UPDATE',
      
      // Land management
      'LAND_CREATE', 'LAND_UPDATE', 'LAND_DELETE', 'LAND_VIEW',
      
      // Listing actions
      'LISTING_CREATE', 'LISTING_UPDATE', 'LISTING_DELETE', 'LISTING_VIEW',
      'LISTING_APPROVE', 'LISTING_REJECT',
      
      // Transaction actions
      'TRANSACTION_CREATE', 'TRANSACTION_UPDATE', 'TRANSACTION_DELETE',
      'TRANSACTION_APPROVE', 'TRANSACTION_REJECT', 'TRANSACTION_COMPLETE',
      
      // System actions
      'SYSTEM_STARTUP', 'SYSTEM_SHUTDOWN', 'SYSTEM_ERROR', 'SYSTEM_WARNING',
      'SESSION_CLEANUP', 'DATABASE_BACKUP', 'DATABASE_RESTORE',
      
      // Admin actions
      'ADMIN_LOGIN', 'ADMIN_ACTION', 'USER_FORCE_LOGOUT', 'SYSTEM_MAINTENANCE',
      
      // File operations
      'FILE_UPLOAD', 'FILE_DELETE', 'FILE_DOWNLOAD', 'FILE_VIEW',
      
      // API actions
      'API_REQUEST', 'API_RESPONSE', 'API_ERROR',
      
      // Security events
      'LOGIN_ATTEMPT', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED',
      'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'
    ]
  },
  
  // Resource information
  resourceType: {
    type: String,
    required: false,
    enum: ['USER', 'LAND', 'LISTING', 'TRANSACTION', 'SESSION', 'SYSTEM', 'FILE', 'API']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  resourceName: {
    type: String,
    required: false
  },

  // Request details
  method: {
    type: String,
    required: false,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'SYSTEM']
  },
  endpoint: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },

  // Data changes
  oldData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  changes: {
    type: [String],
    required: false
  },

  // Status and metadata
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILURE', 'PENDING', 'ERROR', 'WARNING', 'INFO']
  },
  statusCode: {
    type: Number,
    required: false
  },
  errorMessage: {
    type: String,
    required: false
  },
  errorStack: {
    type: String,
    required: false
  },

  // Performance metrics
  duration: {
    type: Number, // in milliseconds
    required: false
  },
  requestSize: {
    type: Number, // in bytes
    required: false
  },
  responseSize: {
    type: Number, // in bytes
    required: false
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Tags for easy filtering
  tags: {
    type: [String],
    required: false
  },
  
  // Priority level
  priority: {
    type: String,
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  }
}, {
  timestamps: true,
  // Indexes for better query performance
  indexes: [
    { userId: 1, timestamp: -1 },
    { action: 1, timestamp: -1 },
    { resourceType: 1, resourceId: 1 },
    { status: 1, timestamp: -1 },
    { timestamp: -1 },
    { sessionId: 1 },
    { ipAddress: 1, timestamp: -1 },
    { priority: 1, timestamp: -1 }
  ]
});

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for action category
auditLogSchema.virtual('actionCategory').get(function() {
  const categories = {
    'USER_SIGNUP': 'AUTHENTICATION',
    'USER_SIGNIN': 'AUTHENTICATION',
    'USER_SIGNOUT': 'AUTHENTICATION',
    'PASSWORD_CHANGE': 'AUTHENTICATION',
    'PASSWORD_RESET': 'AUTHENTICATION',
    'SESSION_CREATE': 'SESSION',
    'SESSION_DESTROY': 'SESSION',
    'SESSION_EXPIRE': 'SESSION',
    'USER_CREATE': 'USER_MANAGEMENT',
    'USER_UPDATE': 'USER_MANAGEMENT',
    'USER_DELETE': 'USER_MANAGEMENT',
    'LAND_CREATE': 'LAND_MANAGEMENT',
    'LAND_UPDATE': 'LAND_MANAGEMENT',
    'LAND_DELETE': 'LAND_MANAGEMENT',
    'LISTING_CREATE': 'LISTING_MANAGEMENT',
    'LISTING_UPDATE': 'LISTING_MANAGEMENT',
    'LISTING_DELETE': 'LISTING_MANAGEMENT',
    'TRANSACTION_CREATE': 'TRANSACTION_MANAGEMENT',
    'TRANSACTION_UPDATE': 'TRANSACTION_MANAGEMENT',
    'TRANSACTION_DELETE': 'TRANSACTION_MANAGEMENT',
    'SYSTEM_STARTUP': 'SYSTEM',
    'SYSTEM_SHUTDOWN': 'SYSTEM',
    'SYSTEM_ERROR': 'SYSTEM',
    'FILE_UPLOAD': 'FILE_OPERATIONS',
    'FILE_DELETE': 'FILE_OPERATIONS',
    'API_REQUEST': 'API',
    'API_RESPONSE': 'API',
    'API_ERROR': 'API',
    'LOGIN_ATTEMPT': 'SECURITY',
    'LOGIN_FAILED': 'SECURITY',
    'UNAUTHORIZED_ACCESS': 'SECURITY'
  };
  return categories[this.action] || 'OTHER';
});

// Pre-save middleware to add tags based on action and status
auditLogSchema.pre('save', function(next) {
  if (!this.tags) {
    this.tags = [];
  }
  
  // Add action category tag
  this.tags.push(this.actionCategory);
  
  // Add status tag
  this.tags.push(this.status);
  
  // Add priority tag
  this.tags.push(this.priority);
  
  // Add security tag for security-related actions
  if (['LOGIN_ATTEMPT', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY'].includes(this.action)) {
    this.tags.push('SECURITY');
  }
  
  // Add error tag for failed actions
  if (this.status === 'ERROR' || this.status === 'FAILURE') {
    this.tags.push('ERROR');
  }
  
  next();
});

// Static method to get logs by user
auditLogSchema.statics.getUserLogs = function(userId, options = {}) {
  const { limit = 50, skip = 0, action, status, startDate, endDate } = options;
  
  const query = { userId };
  
  if (action) query.action = action;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email role');
};

// Static method to get system logs
auditLogSchema.statics.getSystemLogs = function(options = {}) {
  const { limit = 50, skip = 0, action, status, priority, startDate, endDate } = options;
  
  const query = { resourceType: 'SYSTEM' };
  
  if (action) query.action = action;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get security logs
auditLogSchema.statics.getSecurityLogs = function(options = {}) {
  const { limit = 50, skip = 0, startDate, endDate } = options;
  
  const query = { tags: 'SECURITY' };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email role');
};

// Static method to get error logs
auditLogSchema.statics.getErrorLogs = function(options = {}) {
  const { limit = 50, skip = 0, startDate, endDate } = options;
  
  const query = { status: { $in: ['ERROR', 'FAILURE'] } };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email role');
};

// Static method to get logs summary
auditLogSchema.statics.getLogsSummary = function(startDate, endDate) {
  const query = {};
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status',
          priority: '$priority'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        statuses: {
          $push: {
            status: '$_id.status',
            priority: '$_id.priority',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 