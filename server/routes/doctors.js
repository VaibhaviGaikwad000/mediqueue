const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { Doctor, User, Department, Appointment } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, fail, requireFields, validId } = require('../utils/http');
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function doctorView(query) { return query.populate('userId', 'name').populate('departmentId', 'name'); }
router.get('/me', protect, authorize('doctor'), asyncHandler(async (req, res) => { const doc = await doctorView(Doctor.findOne({ userId: req.user._id })); if (!doc) throw fail('Doctor profile not found', 404); res.json(doc); }));
router.put('/me', protect, authorize('doctor'), asyncHandler(async (req, res) => {
  requireFields(req.body, []);
  const allowed = ['avgConsultTime', 'isActive', 'availability'];
  if (Object.keys(req.body).some(key => !allowed.includes(key))) throw fail('Request contains unsupported doctor settings');
  const patch = {};
  if (req.body.avgConsultTime !== undefined) {
    const n = Number(req.body.avgConsultTime);
    if (!Number.isInteger(n) || n < 1 || n > 120) throw fail('Consultation time must be between 1 and 120 minutes');
    patch.avgConsultTime = n;
  }
  if (req.body.isActive !== undefined) {
    if (typeof req.body.isActive !== 'boolean') throw fail('isActive must be a boolean');
    patch.isActive = req.body.isActive;
  }
  if (req.body.availability !== undefined) {
    if (!Array.isArray(req.body.availability) || req.body.availability.some(day => !days.includes(day))) throw fail('Availability must contain weekday abbreviations');
    patch.availability = [...new Set(req.body.availability)];
  }
  if (Object.keys(patch).length === 0) throw fail('Provide at least one doctor setting to update');
  const doc = await Doctor.findOneAndUpdate({ userId: req.user._id }, patch, { new: true, runValidators: true });
  if (!doc) throw fail('Doctor profile not found', 404);
  res.json(doc);
}));
router.get('/', asyncHandler(async (req, res) => { const filter = {}; if (req.query.departmentId) filter.departmentId = req.query.departmentId; if (req.query.all !== 'true') filter.isActive = true; res.json(await doctorView(Doctor.find(filter).sort({ specialization: 1 }))); }));
router.get('/:id', asyncHandler(async (req, res) => { const doc = await doctorView(Doctor.findById(req.params.id)); if (!doc || (!doc.isActive && req.user?.role !== 'admin')) throw fail('Doctor not found', 404); res.json(doc); }));
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password', 'departmentId', 'specialization']);
  const { name, email, password, departmentId, specialization } = req.body;
  if (String(name).trim().length < 2 || String(name).trim().length > 100) throw fail('Doctor name must be 2 to 100 characters');
  if (!/^\S+@\S+\.\S+$/.test(String(email)) || String(email).length > 254) throw fail('Enter a valid email address');
  if (String(password).length < 8 || String(password).length > 100) throw fail('Password must be 8 to 100 characters');
  if (String(specialization).trim().length < 2 || String(specialization).trim().length > 100) throw fail('Specialization must be 2 to 100 characters');
  const avgConsultTime = req.body.avgConsultTime === undefined ? 10 : Number(req.body.avgConsultTime);
  if (!Number.isInteger(avgConsultTime) || avgConsultTime < 1 || avgConsultTime > 120) throw fail('Consultation time must be between 1 and 120 minutes');
  if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') throw fail('isActive must be a boolean');
  if (req.body.availability !== undefined && (!Array.isArray(req.body.availability) || req.body.availability.some(day => !days.includes(day)))) throw fail('Availability must contain weekday abbreviations');
  if (!validId(departmentId)) throw fail('Invalid department identifier');
  const department = await Department.findById(departmentId); if (!department) throw fail('Department not found');
  if (await User.exists({ email: String(email).toLowerCase() })) throw fail('Email is already registered', 409);
  const user = await User.create({ name: String(name).trim(), email: String(email).trim().toLowerCase(), phone: String(req.body.phone || '').trim(), password: await bcrypt.hash(String(password), 12), role: 'doctor' });
  try { const doc = await Doctor.create({ userId: user._id, departmentId, specialization: String(specialization).trim(), avgConsultTime, availability: req.body.availability === undefined ? days : [...new Set(req.body.availability)], isActive: req.body.isActive === undefined ? true : req.body.isActive }); res.status(201).json(await doctorView(Doctor.findById(doc._id))); }
  catch (err) { await User.findByIdAndDelete(user._id); throw err; }
}));
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  requireFields(req.body, []);
  const allowed = ['departmentId', 'specialization', 'avgConsultTime', 'availability', 'isActive'];
  if (Object.keys(req.body).some(key => !allowed.includes(key))) throw fail('Request contains unsupported doctor fields');
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];
  if (Object.keys(patch).length === 0) throw fail('Provide at least one doctor field to update');
  if (patch.departmentId !== undefined) {
    if (!validId(patch.departmentId) || !await Department.exists({ _id: patch.departmentId })) throw fail('Department not found');
  }
  if (patch.specialization !== undefined && (typeof patch.specialization !== 'string' || patch.specialization.trim().length < 2 || patch.specialization.trim().length > 100)) throw fail('Specialization must be 2 to 100 characters');
  if (patch.avgConsultTime !== undefined) {
    const value = Number(patch.avgConsultTime);
    if (!Number.isInteger(value) || value < 1 || value > 120) throw fail('Consultation time must be between 1 and 120 minutes');
    patch.avgConsultTime = value;
  }
  if (patch.availability !== undefined && (!Array.isArray(patch.availability) || patch.availability.some(day => !days.includes(day)))) throw fail('Availability must contain weekday abbreviations');
  if (patch.isActive !== undefined && typeof patch.isActive !== 'boolean') throw fail('isActive must be a boolean');
  if (patch.availability) patch.availability = [...new Set(patch.availability)];
  if (patch.specialization) patch.specialization = patch.specialization.trim();
  const doc = await Doctor.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!doc) throw fail('Doctor not found', 404);
  res.json(await doctorView(Doctor.findById(doc._id)));
}));
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => { const doc = await Doctor.findById(req.params.id); if (!doc) throw fail('Doctor not found', 404); if (await Appointment.exists({ doctorId: doc._id, status: { $in: ['waiting', 'in-progress'] } })) throw fail('Doctor has active appointments', 409); await Doctor.deleteOne({ _id: doc._id }); await User.findByIdAndDelete(doc.userId); res.json({ message: 'Doctor deleted' }); }));
module.exports = router;
