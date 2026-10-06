const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { protect } = require('../middleware/auth');
const { asyncHandler, fail, requireFields } = require('../utils/http');
function issueToken(user) { return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }); }
router.post('/register', asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  const name = String(req.body.name).trim(); const email = String(req.body.email).trim().toLowerCase(); const password = String(req.body.password);
  if (name.length < 2 || name.length > 100) throw fail('Name must be 2 to 100 characters');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw fail('Enter a valid email address');
  if (password.length < 8 || password.length > 100) throw fail('Password must be 8 to 100 characters');
  if (await User.exists({ email })) throw fail('Email is already registered', 409);
  const user = await User.create({ name, email, phone: String(req.body.phone || '').trim(), password: await bcrypt.hash(password, 12), role: 'patient' });
  res.status(201).json({ token: issueToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));
router.post('/login', asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(String(req.body.password), user.password))) throw fail('Invalid email or password', 401);
  res.json({ token: issueToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));
router.get('/me', protect, (req, res) => res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role } }));
module.exports = router;
