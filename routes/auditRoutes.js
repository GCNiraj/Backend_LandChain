const express = require('express');
const auditController = require('../controllers/auditController');
const authController = require('../controllers/authController');
const router = express.Router();

// All audit routes require authentication and admin privileges
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Get all audit logs with filtering
router.get('/', auditController.getAuditLogs);

// Get audit logs summary/statistics
router.get('/summary', auditController.getAuditLogsSummary);

// Get audit log by ID
router.get('/:id', auditController.getAuditLog);

// Get user-specific audit logs
router.get('/user/:userId', auditController.getUserAuditLogs);

// Get system logs
router.get('/system/logs', auditController.getSystemLogs);

// Get security logs
router.get('/security/logs', auditController.getSecurityLogs);

// Get error logs
router.get('/error/logs', auditController.getErrorLogs);

// Export audit logs
router.get('/export/csv', auditController.exportAuditLogs);

// Get audit logs by date range
router.get('/stats/date-range', auditController.getAuditLogsByDateRange);

// Clean up old audit logs
router.delete('/cleanup', auditController.cleanupAuditLogs);

module.exports = router; 