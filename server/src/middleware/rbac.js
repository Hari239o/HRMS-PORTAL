// RBAC helpers centralizing common permission checks
const { db } = require('../db');

/**
 * permitRoles: middleware factory that allows a request if user's role
 * matches one of the allowed roles. When 'employee' is used as an allowed
 * role it means "any non-admin" (so managers or other non-admin roles are
 * treated as employees for permission checks where appropriate).
 */
const permitRoles = (allowed = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

    const role = req.user.role || 'employee';
    // direct match
    if (allowed.includes(role)) return next();

    // allow any non-admin when 'employee' is allowed
    if (allowed.includes('employee') && role !== 'admin') return next();

    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  };
};

/**
 * ownerOrAdmin: checks that the current user is either the owner id (ownerId)
 * or has admin role. ownerId can be provided as a string (field name on req.params
 * or req.body) or a function returning the owner id given (req).
 */
const ownerOrAdmin = (ownerId) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role === 'admin') return next();

    let id = null;
    try {
      if (typeof ownerId === 'function') id = await ownerId(req);
      else if (typeof ownerId === 'string') {
        id = req.params[ownerId] || req.body[ownerId] || req.query[ownerId] || null;
      }
    } catch (e) {
      console.error('ownerOrAdmin error resolving owner id', e);
    }

    if (!id) return res.status(403).json({ error: 'Access denied' });
    if (id === req.user.id) return next();
    return res.status(403).json({ error: 'Access denied' });
  };
};

module.exports = { permitRoles, ownerOrAdmin };
