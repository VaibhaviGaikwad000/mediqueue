const { Appointment, Queue, Doctor } = require('../models');
const { sendMail } = require('./mail');

async function allocateToken(doctorId, date) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const queue = await Queue.findOneAndUpdate({ doctorId, date }, { $inc: { totalTokens: 1 }, $setOnInsert: { currentToken: 0 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
      return queue.totalTokens;
    } catch (err) { if (err.code !== 11000 || attempt === 4) throw err; }
  }
}
async function queueSnapshot(doctorId, date, includePatients = false) {
  const queue = await Queue.findOne({ doctorId, date });
  const appointments = await Appointment.find({ doctorId, date, status: { $in: ['waiting', 'in-progress'] } }).sort({ tokenNumber: 1 }).populate('patientId', 'name email phone');
  const doc = await Doctor.findById(doctorId).select('avgConsultTime');
  const currentToken = queue?.currentToken || (appointments.find(a => a.status === 'in-progress')?.tokenNumber || 0);
  const waiting = appointments.filter(a => a.status === 'waiting');
  const current = appointments.find(a => a.status === 'in-progress') || null;
  const forPatients = a => ({ id: a._id, tokenNumber: a.tokenNumber, status: a.status, timeSlot: a.timeSlot, ...(includePatients ? { patient: a.patientId } : {}) });
  const waitingAhead = appointment => appointments.filter(other =>
    other.tokenNumber < appointment.tokenNumber && ['waiting', 'in-progress'].includes(other.status)
  ).length;
  return {
    doctorId,
    date,
    currentToken,
    totalTokens: queue?.totalTokens || 0,
    nowServing: current ? forPatients(current) : null,
    patientsAhead: 0,
    waiting: waiting.map(appointment => ({ ...forPatients(appointment), patientsAhead: waitingAhead(appointment) })),
    avgConsultTime: doc?.avgConsultTime || 10
  };
}
async function notifyNearTurn(doctorId, date) {
  const waiting = await Appointment.find({ doctorId, date, status: 'waiting', notified: false }).sort({ tokenNumber: 1 }).populate('patientId', 'name email');
  const current = await Appointment.findOne({ doctorId, date, status: 'in-progress' }).select('tokenNumber');
  const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
  for (let index = 0; index < waiting.length; index++) {
    const appointment = waiting[index];
    const ahead = index +
      (current && current.tokenNumber < appointment.tokenNumber ? 1 : 0);
    if (ahead > 3) break;
    if (!appointment.patientId?.email) continue;
    try {
      await sendMail({ to: appointment.patientId.email, subject: 'Your MediQueue turn is coming up', text: `Hello ${appointment.patientId.name}, there are ${ahead} patient(s) ahead of you for ${doctor?.userId?.name || 'your doctor'}. Please get ready.` });
      appointment.notified = true;
      await appointment.save();
    } catch (error) {
      console.error(`Turn notification failed for appointment ${appointment._id}:`, error);
    }
  }
}
async function emitQueueUpdated(io, doctorId, date) {
  const snapshot = await queueSnapshot(doctorId, date, false);
  io.to(`doctor_${doctorId}`).emit('queueUpdated', snapshot);
  await notifyNearTurn(doctorId, date);
  return snapshot;
}
module.exports = { allocateToken, queueSnapshot, emitQueueUpdated };
