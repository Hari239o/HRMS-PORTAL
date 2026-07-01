const jwt = require('jsonwebtoken');
const prisma = require('../../prisma/client');

const hasMultiDeviceAccess = (role) => {
  return role === 'admin' || role === 'manager' || role.endsWith('_manager');
};

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const dbEmp = await prisma.employee.findUnique({ 
      where: { id: decoded.id },
      select: { id: true, role: true, deviceId: true }
    });
    if (!dbEmp) return res.status(401).json({ error: 'User not found.' });

    const enforceDeviceLock = !hasMultiDeviceAccess(dbEmp.role);
    if (enforceDeviceLock && dbEmp.deviceId && decoded.deviceId !== dbEmp.deviceId) {
      return res.status(401).json({ error: 'Device mismatch detected. Please login from your assigned device.' });
    }

    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
