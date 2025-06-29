const AuditLog = require('../models/auditLogModels');
const AppError = require('../utils/appError');

// Get all audit logs with filtering
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      status,
      priority,
      resourceType,
      userId,
      startDate,
      endDate,
      ipAddress,
      tags
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Build query filters
    if (action) query.action = action;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.userId = userId;
    if (ipAddress) query.ipAddress = ipAddress;
    if (tags) query.tags = { $in: tags.split(',') };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get user-specific audit logs
exports.getUserAuditLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      action,
      status,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (page - 1) * limit,
      action,
      status,
      startDate,
      endDate
    };

    const logs = await AuditLog.getUserLogs(userId, options);
    const total = await AuditLog.countDocuments({ userId });

    res.status(200).json({
      status: 'success',
      data: {
        userId,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get system logs
exports.getSystemLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      status,
      priority,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (page - 1) * limit,
      action,
      status,
      priority,
      startDate,
      endDate
    };

    const logs = await AuditLog.getSystemLogs(options);
    const total = await AuditLog.countDocuments({ resourceType: 'SYSTEM' });

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get security logs
exports.getSecurityLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (page - 1) * limit,
      startDate,
      endDate
    };

    const logs = await AuditLog.getSecurityLogs(options);
    const total = await AuditLog.countDocuments({ tags: 'SECURITY' });

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get error logs
exports.getErrorLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (page - 1) * limit,
      startDate,
      endDate
    };

    const logs = await AuditLog.getErrorLogs(options);
    const total = await AuditLog.countDocuments({ status: { $in: ['ERROR', 'FAILURE'] } });

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get audit logs summary/statistics
exports.getAuditLogsSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const summary = await AuditLog.getLogsSummary(startDate, endDate);

    // Get additional statistics
    const totalLogs = await AuditLog.countDocuments();
    const todayLogs = await AuditLog.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const errorLogs = await AuditLog.countDocuments({ status: { $in: ['ERROR', 'FAILURE'] } });
    const securityLogs = await AuditLog.countDocuments({ tags: 'SECURITY' });

    res.status(200).json({
      status: 'success',
      data: {
        summary,
        statistics: {
          totalLogs,
          todayLogs,
          errorLogs,
          securityLogs
        }
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get audit log by ID
exports.getAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id).populate('userId', 'name email role');

    if (!log) {
      return next(new AppError('Audit log not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        log
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Export audit logs (CSV format)
exports.exportAuditLogs = async (req, res, next) => {
  try {
    const {
      action,
      status,
      priority,
      resourceType,
      userId,
      startDate,
      endDate,
      format = 'csv'
    } = req.query;

    const query = {};

    // Build query filters
    if (action) query.action = action;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.userId = userId;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role');

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'Action',
        'User Email',
        'User Role',
        'Resource Type',
        'Resource Name',
        'Method',
        'Endpoint',
        'IP Address',
        'Status',
        'Status Code',
        'Duration (ms)',
        'Priority',
        'Tags'
      ];

      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.action,
        log.userEmail || '',
        log.userRole || '',
        log.resourceType || '',
        log.resourceName || '',
        log.method || '',
        log.endpoint || '',
        log.ipAddress || '',
        log.status,
        log.statusCode || '',
        log.duration || '',
        log.priority,
        log.tags?.join(', ') || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.status(200).json({
        status: 'success',
        data: {
          logs,
          count: logs.length
        }
      });
    }
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Clean up old audit logs
exports.cleanupAuditLogs = async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.status(200).json({
      status: 'success',
      data: {
        deletedCount: result.deletedCount,
        message: `Deleted ${result.deletedCount} audit logs older than ${days} days`
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Get audit log statistics by date range
exports.getAuditLogsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return next(new AppError('Start date and end date are required', 400));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let dateFormat;
    let groupId;

    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d-%H';
        groupId = { $dateToString: { format: '%Y-%m-%d-%H', date: '$timestamp' } };
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupId = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupId = { $dateToString: { format: '%Y-%m', date: '$timestamp' } };
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupId = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
    }

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          errors: {
            $sum: {
              $cond: [{ $in: ['$status', ['ERROR', 'FAILURE']] }, 1, 0]
            }
          },
          security: {
            $sum: {
              $cond: [{ $in: ['SECURITY', '$tags'] }, 1, 0]
            }
          },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const results = await AuditLog.aggregate(pipeline);

    res.status(200).json({
      status: 'success',
      data: {
        groupBy,
        dateRange: { startDate, endDate },
        results
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
}; 