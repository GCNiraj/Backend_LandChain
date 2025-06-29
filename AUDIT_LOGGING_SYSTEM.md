# Audit Logging System Documentation

## Overview
The audit logging system provides comprehensive tracking of all user actions, system events, and security incidents in the Land Lockchain application. All activities are stored in MongoDB for persistent, searchable, and analyzable audit trails.

## Features

### ✅ **Comprehensive Logging**
- **User Actions**: All user interactions (login, logout, CRUD operations)
- **System Events**: Server startup, shutdown, errors, warnings
- **Security Events**: Failed logins, unauthorized access, suspicious activity
- **File Operations**: Uploads, downloads, deletions
- **API Requests**: All API calls with performance metrics
- **Session Management**: Session creation, destruction, expiration

### 🔍 **Advanced Filtering & Search**
- Filter by user, action type, status, priority
- Date range filtering
- IP address tracking
- Resource-specific queries
- Tag-based categorization

### 📊 **Analytics & Reporting**
- Real-time statistics and summaries
- Date range analytics
- Export to CSV format
- Performance metrics tracking
- Security incident reporting

### 🛡️ **Security Features**
- Sensitive data redaction
- IP address tracking
- User agent logging
- Session correlation
- Error stack traces

## Database Schema

### AuditLog Model
```javascript
{
  // User Information
  userId: ObjectId,           // Reference to User model
  userEmail: String,          // User's email
  userRole: String,           // User's role
  sessionId: String,          // Session identifier

  // Action Details
  action: String,             // Action type (enum)
  resourceType: String,       // Resource type (USER, LAND, etc.)
  resourceId: ObjectId,       // Resource identifier
  resourceName: String,       // Human-readable resource name

  // Request Information
  method: String,             // HTTP method
  endpoint: String,           // API endpoint
  ipAddress: String,          // Client IP address
  userAgent: String,          // Browser/client info

  // Data Changes
  oldData: Mixed,             // Previous data state
  newData: Mixed,             // New data state
  changes: [String],          // Array of change descriptions

  // Status & Performance
  status: String,             // SUCCESS, FAILURE, ERROR, etc.
  statusCode: Number,         // HTTP status code
  duration: Number,           // Request duration in ms
  requestSize: Number,        // Request size in bytes
  responseSize: Number,       // Response size in bytes

  // Error Information
  errorMessage: String,       // Error message
  errorStack: String,         // Error stack trace

  // Metadata
  timestamp: Date,            // Event timestamp
  priority: String,           // LOW, MEDIUM, HIGH, CRITICAL
  tags: [String],             // Categorization tags
  metadata: Mixed             // Additional data
}
```

## Action Types

### Authentication Actions
- `USER_SIGNUP` - User registration
- `USER_SIGNIN` - User login
- `USER_SIGNOUT` - User logout
- `PASSWORD_CHANGE` - Password modification
- `PASSWORD_RESET` - Password reset

### Session Actions
- `SESSION_CREATE` - Session creation
- `SESSION_DESTROY` - Session destruction
- `SESSION_EXPIRE` - Session expiration

### User Management
- `USER_CREATE` - Create user (admin)
- `USER_UPDATE` - Update user profile
- `USER_DELETE` - Delete user
- `USER_PROFILE_UPDATE` - Profile modifications

### Land Management
- `LAND_CREATE` - Create land record
- `LAND_UPDATE` - Update land information
- `LAND_DELETE` - Delete land record
- `LAND_VIEW` - View land details

### Listing Actions
- `LISTING_CREATE` - Create listing
- `LISTING_UPDATE` - Update listing
- `LISTING_DELETE` - Delete listing
- `LISTING_VIEW` - View listing
- `LISTING_APPROVE` - Approve listing
- `LISTING_REJECT` - Reject listing

### Transaction Actions
- `TRANSACTION_CREATE` - Create transaction
- `TRANSACTION_UPDATE` - Update transaction
- `TRANSACTION_DELETE` - Delete transaction
- `TRANSACTION_APPROVE` - Approve transaction
- `TRANSACTION_REJECT` - Reject transaction
- `TRANSACTION_COMPLETE` - Complete transaction

### System Actions
- `SYSTEM_STARTUP` - Server startup
- `SYSTEM_SHUTDOWN` - Server shutdown
- `SYSTEM_ERROR` - System error
- `SYSTEM_WARNING` - System warning
- `SESSION_CLEANUP` - Session cleanup
- `DATABASE_BACKUP` - Database backup
- `DATABASE_RESTORE` - Database restore

### File Operations
- `FILE_UPLOAD` - File upload
- `FILE_DELETE` - File deletion
- `FILE_DOWNLOAD` - File download
- `FILE_VIEW` - File viewing

### API Actions
- `API_REQUEST` - API request
- `API_RESPONSE` - API response
- `API_ERROR` - API error

### Security Events
- `LOGIN_ATTEMPT` - Login attempt
- `LOGIN_FAILED` - Failed login
- `UNAUTHORIZED_ACCESS` - Unauthorized access
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `SUSPICIOUS_ACTIVITY` - Suspicious activity
- `ACCOUNT_LOCKED` - Account locked
- `ACCOUNT_UNLOCKED` - Account unlocked

## API Endpoints

### Audit Log Management (Admin Only)

#### Get All Audit Logs
```
GET /api/v1/audit
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 50)
- action: Filter by action type
- status: Filter by status
- priority: Filter by priority
- resourceType: Filter by resource type
- userId: Filter by user ID
- startDate: Start date (ISO format)
- endDate: End date (ISO format)
- ipAddress: Filter by IP address
- tags: Comma-separated tags
```

#### Get Audit Log Summary
```
GET /api/v1/audit/summary
Query Parameters:
- startDate: Start date (ISO format)
- endDate: End date (ISO format)
```

#### Get Specific Audit Log
```
GET /api/v1/audit/:id
```

#### Get User-Specific Logs
```
GET /api/v1/audit/user/:userId
Query Parameters:
- page, limit, action, status, startDate, endDate
```

#### Get System Logs
```
GET /api/v1/audit/system/logs
Query Parameters:
- page, limit, action, status, priority, startDate, endDate
```

#### Get Security Logs
```
GET /api/v1/audit/security/logs
Query Parameters:
- page, limit, startDate, endDate
```

#### Get Error Logs
```
GET /api/v1/audit/error/logs
Query Parameters:
- page, limit, startDate, endDate
```

#### Export Audit Logs
```
GET /api/v1/audit/export/csv
Query Parameters:
- action, status, priority, resourceType, userId, startDate, endDate
```

#### Get Date Range Statistics
```
GET /api/v1/audit/stats/date-range
Query Parameters:
- startDate: Required (ISO format)
- endDate: Required (ISO format)
- groupBy: hour, day, month (default: day)
```

#### Clean Up Old Logs
```
DELETE /api/v1/audit/cleanup
Query Parameters:
- days: Days to keep (default: 90)
```

## Usage Examples

### Basic Logging
```javascript
const auditLogger = require('./utils/auditLogger');

// Log user action
await auditLogger.logUserAction('USER_UPDATE', user, updatedUser, req, oldData, newData);

// Log system event
await auditLogger.logSystemAction('SYSTEM_STARTUP', {
  version: '1.0.0',
  environment: 'production'
});

// Log security event
await auditLogger.logSecurityEvent('LOGIN_FAILED', null, req, {
  email: 'user@example.com',
  reason: 'Invalid password'
});
```

### Using Middleware
```javascript
const { auditAuthMiddleware, auditCrudMiddleware } = require('./utils/auditMiddleware');

// Apply to routes
router.post('/signin', auditAuthMiddleware('USER_SIGNIN'), authController.signin);
router.put('/users/:id', auditCrudMiddleware('USER_UPDATE', 'USER'), userController.updateUser);
```

### Querying Logs
```javascript
// Get user logs
const userLogs = await AuditLog.getUserLogs(userId, {
  limit: 50,
  action: 'USER_SIGNIN',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Get security logs
const securityLogs = await AuditLog.getSecurityLogs({
  limit: 100,
  startDate: '2024-01-01'
});

// Get error logs
const errorLogs = await AuditLog.getErrorLogs({
  limit: 50
});
```

## Configuration

### Environment Variables
```env
# Audit Logging Configuration
AUDIT_LOGGING_ENABLED = true
AUDIT_LOG_LEVEL = INFO
AUDIT_LOG_BATCH_SIZE = 100
AUDIT_LOG_BATCH_TIMEOUT = 5000
```

### Configuration Options
- `AUDIT_LOGGING_ENABLED`: Enable/disable audit logging
- `AUDIT_LOG_LEVEL`: Logging level (INFO, DEBUG, etc.)
- `AUDIT_LOG_BATCH_SIZE`: Number of logs to batch before saving
- `AUDIT_LOG_BATCH_TIMEOUT`: Timeout for batch processing (ms)

## Performance Considerations

### Batching
- Logs are batched for better performance
- Critical logs (ERROR, CRITICAL) are saved immediately
- Other logs are batched and saved periodically

### Indexing
- Database indexes on frequently queried fields
- Optimized for timestamp-based queries
- User and action-based indexes

### Cleanup
- Automatic cleanup of old logs
- Configurable retention period
- Manual cleanup via API

## Security Features

### Data Protection
- Sensitive headers are redacted (authorization, cookies)
- Passwords are never logged
- Personal data is sanitized

### Access Control
- All audit endpoints require admin privileges
- User can only view their own logs (if implemented)
- Audit logs cannot be modified or deleted

### Monitoring
- Real-time security event detection
- Suspicious activity alerts
- Failed login tracking
- Unauthorized access monitoring

## Monitoring & Alerts

### Real-time Monitoring
```javascript
// Monitor for security events
const securityEvents = await AuditLog.getSecurityLogs({
  limit: 10,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
});

// Check for high-priority errors
const criticalErrors = await AuditLog.find({
  priority: 'CRITICAL',
  timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
});
```

### Automated Alerts
- High error rates
- Multiple failed login attempts
- Unusual user activity patterns
- System performance issues

## Best Practices

### Development
1. **Log All Important Actions**: Log user actions, system events, and errors
2. **Use Appropriate Priorities**: Use CRITICAL for security events, HIGH for errors
3. **Include Context**: Always include relevant metadata and context
4. **Sanitize Data**: Never log sensitive information like passwords

### Production
1. **Monitor Log Volume**: Set up alerts for unusual log volumes
2. **Regular Cleanup**: Implement automated log cleanup
3. **Backup Strategy**: Include audit logs in backup strategy
4. **Performance Monitoring**: Monitor database performance for audit queries

### Security
1. **Access Control**: Restrict audit log access to admins only
2. **Data Retention**: Implement appropriate data retention policies
3. **Encryption**: Consider encrypting sensitive audit data
4. **Monitoring**: Set up alerts for security events

## Troubleshooting

### Common Issues
1. **High Log Volume**: Adjust batch size and timeout
2. **Performance Issues**: Check database indexes
3. **Missing Logs**: Verify audit logging is enabled
4. **Permission Errors**: Check admin privileges

### Debugging
1. **Check Log Status**: Use `/api/v1/audit/summary` endpoint
2. **Monitor Database**: Check MongoDB performance
3. **Review Configuration**: Verify environment variables
4. **Test Logging**: Use test endpoints to verify functionality

## Integration Examples

### Frontend Integration
```javascript
// React component for audit log viewer
const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({});

  const fetchLogs = async () => {
    const response = await fetch('/api/v1/audit?' + new URLSearchParams(filters));
    const data = await response.json();
    setLogs(data.data.logs);
  };

  return (
    <div>
      <AuditLogFilters filters={filters} onChange={setFilters} />
      <AuditLogTable logs={logs} />
    </div>
  );
};
```

### Dashboard Integration
```javascript
// Dashboard widget for audit statistics
const AuditStatsWidget = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/v1/audit/summary');
      const data = await response.json();
      setStats(data.data.statistics);
    };
    fetchStats();
  }, []);

  return (
    <div className="stats-widget">
      <h3>Audit Statistics</h3>
      <p>Total Logs: {stats.totalLogs}</p>
      <p>Today's Logs: {stats.todayLogs}</p>
      <p>Error Logs: {stats.errorLogs}</p>
      <p>Security Events: {stats.securityLogs}</p>
    </div>
  );
};
```

This audit logging system provides comprehensive tracking and monitoring capabilities for your Land Lockchain application, ensuring full visibility into all system activities and user actions. 