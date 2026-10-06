const router = require('express').Router();
const { Appointment, Doctor, Queue } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, fail, requireFields } = require('../utils/http');
const { today, isValidDateString } = require('../utils/date');
const { queueSnapshot, emitQueueUpdated } = require('../utils/queue');

async function requireQueueAccess(req, doctorId) {
  if (req.user.role === 'admin') return;
  const doctor = await Doctor.findOne({ _id: doctorId, userId: req.user._id });
  if (!doctor) throw fail('You do not own this doctor queue', 403);
}

router.get('/:doctorId', protect, asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!doctor) throw fail('Doctor not found', 404);
  const date = req.query.date || today();
  if (!isValidDateString(date)) throw fail('Date must be a valid YYYY-MM-DD date');
  const isStaff = ['doctor', 'admin'].includes(req.user.role);
  const snapshot = await queueSnapshot(doctor._id.toString(), date, isStaff);
  if (req.user.role === 'patient') {
    const own = await Appointment.findOne({ doctorId: doctor._id, date, patientId: req.user._id, status: { $in: ['waiting', 'in-progress'] } });
    const active = await Appointment.find({ doctorId: doctor._id, date, status: { $in: ['waiting', 'in-progress'] } }).sort({ tokenNumber: 1 });
    snapshot.myAppointment = own ? {
      id: own._id,
      tokenNumber: own.tokenNumber,
      status: own.status,
      patientsAhead: active.filter(item => item.tokenNumber < own.tokenNumber).length
    } : null;
    snapshot.waiting = snapshot.waiting.map(({ id, tokenNumber, status, timeSlot }) => ({ id, tokenNumber, status, timeSlot }));
    delete snapshot.nowServing?.patient;
  }
  if (isStaff) await requireQueueAccess(req, doctor._id);
  res.json(snapshot);
}));

async function advanceQueue(req, res, action) {
  requireFields(req.body, []);
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!doctor) throw fail('Doctor not found', 404);
  await requireQueueAccess(req, doctor._id);
  const date = req.body.date || today();
  if (!isValidDateString(date)) throw fail('Date must be a valid YYYY-MM-DD date');
  const queue = await Queue.findOneAndUpdate(
    { doctorId: doctor._id, date },
    { $setOnInsert: { currentToken: 0, totalTokens: 0 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const current = await Appointment.findOne({ doctorId: doctor._id, date, status: 'in-progress' });
  if (action === 'next') {
    if (current) {
      current.status = 'completed';
      current.completedAt = new Date();
      await current.save();
    }
    const next = await Appointment.findOne({ doctorId: doctor._id, date, status: 'waiting' }).sort({ tokenNumber: 1 });
    if (next) {
      next.status = 'in-progress';
      next.calledAt = new Date();
      await next.save();
      queue.currentToken = next.tokenNumber;
      await queue.save();
    } else if (current) {
      queue.currentToken = current.tokenNumber;
      await queue.save();
    }
  } else {
    if (!current) throw fail('There is no patient currently being served', 409);
    current.status = action === 'complete' ? 'completed' : 'no-show';
    if (action === 'complete') current.completedAt = new Date();
    await current.save();
    if (action === 'complete') queue.currentToken = current.tokenNumber;
    await queue.save();
  }
  const snapshot = await emitQueueUpdated(req.app.get('io'), doctor._id.toString(), date);
  res.json(snapshot);
}

router.patch('/:doctorId/next', protect, authorize('doctor', 'admin'), asyncHandler((req, res) => advanceQueue(req, res, 'next')));
router.patch('/:doctorId/complete', protect, authorize('doctor', 'admin'), asyncHandler((req, res) => advanceQueue(req, res, 'complete')));
router.patch('/:doctorId/noshow', protect, authorize('doctor', 'admin'), asyncHandler((req, res) => advanceQueue(req, res, 'noshow')));

module.exports = router;
