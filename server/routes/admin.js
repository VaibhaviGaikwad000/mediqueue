const router = require('express').Router();
const { Appointment, Doctor, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, fail } = require('../utils/http');
const { today, isValidDateString } = require('../utils/date');

router.use(protect, authorize('admin'));

router.get('/stats', asyncHandler(async (req, res) => {
  const date = today();
  const todays = await Appointment.find({ date });
  const completedWithWait = todays.filter(item => item.calledAt && item.createdAt);
  const averageWaitMinutes = completedWithWait.length
    ? Math.round(completedWithWait.reduce((sum, item) => sum + Math.max(0, item.calledAt - item.createdAt) / 60000, 0) / completedWithWait.length)
    : 0;
  const noShows = todays.filter(item => item.status === 'no-show').length;
  const statusCounts = Object.fromEntries(['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'].map(status => [status, todays.filter(item => item.status === status).length]));
  const since = new Date(`${date}T12:00:00Z`);
  since.setUTCDate(since.getUTCDate() - 6);
  const firstDate = since.toISOString().slice(0, 10);
  const lastSevenDays = await Appointment.aggregate([
    { $match: { date: { $gte: firstDate, $lte: date }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$date', total: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json({
    todayTotal: todays.length,
    averageWaitMinutes,
    noShowPercent: todays.length ? Math.round(noShows / todays.length * 100) : 0,
    statusCounts,
    lastSevenDays: Array.from({ length: 7 }, (_, index) => {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + index);
      const key = d.toISOString().slice(0, 10);
      return { date: key, total: lastSevenDays.find(day => day._id === key)?.total || 0 };
    })
  });
}));

router.get('/appointments', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    if (!['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(req.query.status)) throw fail('Invalid appointment status');
    filter.status = req.query.status;
  }
  if (req.query.date) {
    if (!isValidDateString(req.query.date)) throw fail('Date must be a valid YYYY-MM-DD date');
    filter.date = req.query.date;
  }
  if (req.query.doctorId) {
    if (!/^[a-f\d]{24}$/i.test(req.query.doctorId)) throw fail('Invalid doctor identifier');
    filter.doctorId = req.query.doctorId;
  }
  res.json(await Appointment.find(filter).sort({ date: -1, tokenNumber: 1 })
    .limit(500)
    .populate('patientId', 'name email phone')
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'departmentId', select: 'name' }] }));
}));

router.get('/users', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) {
    if (!['patient', 'doctor', 'admin'].includes(req.query.role)) throw fail('Invalid user role');
    filter.role = req.query.role;
  }
  res.json(await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(500));
}));

module.exports = router;
