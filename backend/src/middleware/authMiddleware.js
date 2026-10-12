const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// AUTHENTICATE: Verify JWT token
// ============================================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'role', 'status', 'admin_id', 'manager_id', 'tenant_id']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      admin_id: user.admin_id,
      manager_id: user.manager_id,
      tenant_id: user.tenant_id
    };

    next();
  } catch (error) {
    console.error('Authenticate error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// ============================================
// AUTHORIZE: Check user role
// ============================================
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// ============================================
// OPTIONAL AUTH
// ============================================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'role', 'status', 'admin_id', 'manager_id', 'tenant_id']
    });

    if (user && user.status === 'active') {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        admin_id: user.admin_id,
        manager_id: user.manager_id,
        tenant_id: user.tenant_id
      };
    }

    next();
  } catch (error) {
    next();
  }
};

// ============================================
// SCOPE CHECK
// ============================================
const scopeCheck = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      if (req.user.role === 'manager') {
        if (resource.admin_id && resource.admin_id !== req.user.admin_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this resource'
          });
        }
        req.resource = resource;
        return next();
      }

      if (req.user.role === 'tenant') {
        if (resource.tenant_id && resource.tenant_id !== req.user.tenant_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this resource'
          });
        }
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    } catch (error) {
      console.error('Scope check error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  scopeCheck
};