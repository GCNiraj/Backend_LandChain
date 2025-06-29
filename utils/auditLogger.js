const AuditLog = require('../models/auditLogModels');

class AuditLogger {
  constructor() {
    this.isEnabled = process.env.AUDIT_LOGGING_ENABLED !== 'false';
    this.logLevel = process.env.AUDIT_LOG_LEVEL || 'INFO';
    this.batchSize = parseInt(process.env.AUDIT_LOG_BATCH_SIZE) || 100;
    this.batchTimeout = parseInt(process.env.AUDIT_LOG_BATCH_TIMEOUT) || 5000;
    this.pendingLogs = [];
    this.batchTimer = null;
  }

  // Main logging method
  async log(logData) {
    if (!this.isEnabled) return;

    try {
      const logEntry = this.createLogEntry(logData);
      
      // For critical logs, save immediately
      if (logEntry.priority === 'CRITICAL' || logEntry.status === 'ERROR') {
        await this.saveLog(logEntry);
      } else {
        // For other logs, batch them for performance
        this.addToBatch(logEntry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Create standardized log entry
  createLogEntry(data) {
    const {
      action,
      userId,
      userEmail,
      userRole,
      sessionId,
      resourceType,
      resourceId,
      resourceName,
      method,
      endpoint,
      ipAddress,
      userAgent,
      oldData,
      newData,
      changes,
      status,
      statusCode,
      errorMessage,
      errorStack,
      duration,
      requestSize,
      responseSize,
      metadata,
      priority = 'MEDIUM',
      tags = []
    } = data;

    return {
      action,
      userId,
      userEmail,
      userRole,
      sessionId,
      resourceType,
      resourceId,
      resourceName,
      method,
      endpoint,
      ipAddress,
      userAgent,
      oldData,
      newData,
      changes,
      status,
      statusCode,
      errorMessage,
      errorStack,
      duration,
      requestSize,
      responseSize,
      metadata,
      priority,
      tags,
      timestamp: new Date()
    };
  }

  // Add log to batch
  addToBatch(logEntry) {
    this.pendingLogs.push(logEntry);
    
    if (this.pendingLogs.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.batchTimeout);
    }
  }

  // Flush batch to database
  async flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.pendingLogs.length === 0) return;

    try {
      const logsToSave = [...this.pendingLogs];
      this.pendingLogs = [];
      
      await AuditLog.insertMany(logsToSave);
    } catch (error) {
      console.error('Error flushing audit logs batch:', error);
      // Re-add logs to pending if save failed
      this.pendingLogs.unshift(...this.pendingLogs);
    }
  }

  // Save single log immediately
  async saveLog(logEntry) {
    try {
      const auditLog = new AuditLog(logEntry);
      await auditLog.save();
    } catch (error) {
      console.error('Error saving audit log:', error);
    }
  }

  // Convenience methods for different log types

  // Authentication logs
  async logAuth(action, user, req, status = 'SUCCESS', error = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'USER',
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      status,
      statusCode: req?.res?.statusCode,
      errorMessage: error?.message,
      errorStack: error?.stack,
      priority: status === 'SUCCESS' ? 'MEDIUM' : 'HIGH',
      metadata: {
        userAgent: req?.get('User-Agent'),
        referer: req?.get('Referer')
      }
    });
  }

  // User management logs
  async logUserAction(action, user, targetUser, req, oldData = null, newData = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'USER',
      resourceId: targetUser?._id,
      resourceName: targetUser?.email,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
      status: 'SUCCESS',
      statusCode: req?.res?.statusCode,
      priority: 'MEDIUM'
    });
  }

  // Land management logs
  async logLandAction(action, user, land, req, oldData = null, newData = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'LAND',
      resourceId: land?._id,
      resourceName: land?.title || land?.id,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
      status: 'SUCCESS',
      statusCode: req?.res?.statusCode,
      priority: 'MEDIUM'
    });
  }

  // Listing management logs
  async logListingAction(action, user, listing, req, oldData = null, newData = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'LISTING',
      resourceId: listing?._id,
      resourceName: listing?.title || listing?.id,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
      status: 'SUCCESS',
      statusCode: req?.res?.statusCode,
      priority: 'MEDIUM'
    });
  }

  // Transaction logs
  async logTransactionAction(action, user, transaction, req, oldData = null, newData = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'TRANSACTION',
      resourceId: transaction?._id,
      resourceName: transaction?.transactionId || transaction?.id,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      oldData,
      newData,
      changes: this.getChanges(oldData, newData),
      status: 'SUCCESS',
      statusCode: req?.res?.statusCode,
      priority: 'HIGH'
    });
  }

  // File operation logs
  async logFileAction(action, user, file, req, status = 'SUCCESS', error = null) {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'FILE',
      resourceId: file?._id,
      resourceName: file?.filename || file?.originalname,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      status,
      statusCode: req?.res?.statusCode,
      errorMessage: error?.message,
      errorStack: error?.stack,
      requestSize: req?.file?.size,
      priority: 'MEDIUM',
      metadata: {
        fileSize: file?.size,
        mimeType: file?.mimetype,
        uploadPath: file?.path
      }
    });
  }

  // System logs
  async logSystemAction(action, details = {}, priority = 'MEDIUM') {
    await this.log({
      action,
      resourceType: 'SYSTEM',
      method: 'SYSTEM',
      status: 'SUCCESS',
      priority,
      metadata: details
    });
  }

  // Error logs
  async logError(action, user, req, error, priority = 'HIGH') {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'SYSTEM',
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      status: 'ERROR',
      statusCode: req?.res?.statusCode,
      errorMessage: error?.message,
      errorStack: error?.stack,
      priority,
      metadata: {
        errorName: error?.name,
        errorCode: error?.code
      }
    });
  }

  // Security logs
  async logSecurityEvent(action, user, req, details = {}, priority = 'HIGH') {
    await this.log({
      action,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      sessionId: req?.session?.id,
      resourceType: 'SYSTEM',
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      status: 'WARNING',
      priority,
      metadata: details,
      tags: ['SECURITY']
    });
  }

  // API request/response logs
  async logApiRequest(req, res, duration, status = 'SUCCESS') {
    await this.log({
      action: 'API_REQUEST',
      userId: req?.user?._id,
      userEmail: req?.user?.email,
      userRole: req?.user?.role,
      sessionId: req?.session?.id,
      resourceType: 'API',
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: this.getClientIP(req),
      userAgent: req?.get('User-Agent'),
      status,
      statusCode: res?.statusCode,
      duration,
      requestSize: req?.headers['content-length'],
      responseSize: res?.get('content-length'),
      priority: 'LOW',
      metadata: {
        query: req?.query,
        params: req?.params,
        headers: this.sanitizeHeaders(req?.headers)
      }
    });
  }

  // Utility methods

  getClientIP(req) {
    return req?.ip || 
           req?.connection?.remoteAddress || 
           req?.socket?.remoteAddress ||
           req?.headers['x-forwarded-for']?.split(',')[0] ||
           req?.headers['x-real-ip'] ||
           'unknown';
  }

  getChanges(oldData, newData) {
    if (!oldData || !newData) return [];
    
    const changes = [];
    const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of keys) {
      if (oldData[key] !== newData[key]) {
        changes.push(`${key}: ${oldData[key]} → ${newData[key]}`);
      }
    }
    
    return changes;
  }

  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Cleanup method
  async cleanup() {
    await this.flushBatch();
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

// Graceful shutdown
process.on('SIGINT', async () => {
  await auditLogger.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await auditLogger.cleanup();
  process.exit(0);
});

module.exports = auditLogger; 