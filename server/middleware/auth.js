const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = user;
    next();
  } catch (err) { next(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ? Object.assign(new Error('Invalid or expired token'), { status: 401 }) : err); }
}
function authorize(...roles) { return (req, res, next) => req.user && roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission to do that' }); }
module.exports = { protect, authorize };
