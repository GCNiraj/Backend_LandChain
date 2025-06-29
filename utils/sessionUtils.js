const mongoose = require('mongoose');

// Session monitoring and management utilities
class SessionUtils {
  // Get session statistics
  static async getSessionStats() {
    try {
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      const totalSessions = await sessionsCollection.countDocuments();
      const activeSessions = await sessionsCollection.countDocuments({
        expires: { $gt: new Date() }
      });
      
      return {
        total: totalSessions,
        active: activeSessions,
        expired: totalSessions - activeSessions
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }

  // Clean up expired sessions manually (if needed)
  static async cleanupExpiredSessions() {
    try {
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      const result = await sessionsCollection.deleteMany({
        expires: { $lt: new Date() }
      });
      
      return {
        deletedCount: result.deletedCount,
        message: `Cleaned up ${result.deletedCount} expired sessions`
      };
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      throw error;
    }
  }

  // Get sessions for a specific user
  static async getUserSessions(userId) {
    try {
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      const sessions = await sessionsCollection.find({
        'session.user.id': userId
      }).toArray();
      
      return sessions.map(session => ({
        sessionId: session._id,
        expires: session.expires,
        lastActivity: session.session.lastActivity,
        loginTime: session.session.loginTime,
        visitCount: session.session.visitCount
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Force logout user from all sessions
  static async forceLogoutUser(userId) {
    try {
      const db = mongoose.connection.db;
      const sessionsCollection = db.collection('sessions');
      
      const result = await sessionsCollection.deleteMany({
        'session.user.id': userId
      });
      
      return {
        deletedCount: result.deletedCount,
        message: `Logged out user from ${result.deletedCount} sessions`
      };
    } catch (error) {
      console.error('Error force logging out user:', error);
      throw error;
    }
  }

  // Validate session data structure
  static validateSessionData(session) {
    if (!session) return false;
    
    const requiredFields = ['user', 'lastActivity'];
    const userRequiredFields = ['id', 'email', 'name', 'role'];
    
    // Check required session fields
    for (const field of requiredFields) {
      if (!session[field]) return false;
    }
    
    // Check required user fields
    for (const field of userRequiredFields) {
      if (!session.user[field]) return false;
    }
    
    return true;
  }

  // Create session data structure
  static createSessionData(user) {
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      loginTime: new Date(),
      lastActivity: new Date(),
      visitCount: 1,
      isNewUser: false
    };
  }

  // Update session activity
  static updateSessionActivity(session) {
    if (session) {
      session.lastActivity = new Date();
      session.visitCount = (session.visitCount || 0) + 1;
    }
    return session;
  }

  // Check if session is about to expire (within 5 minutes)
  static isSessionExpiringSoon(session) {
    if (!session || !session.lastActivity) return false;
    
    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const sessionAge = now - lastActivity;
    const warningThreshold = 55 * 60 * 1000; // 55 minutes
    
    return sessionAge > warningThreshold;
  }
}

module.exports = SessionUtils; 