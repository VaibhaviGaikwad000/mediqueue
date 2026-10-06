const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true, default: '' }, password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', required: true }
}, { timestamps: true });
const departmentSchema = new Schema({ name: { type: String, required: true, unique: true, trim: true }, description: { type: String, default: '' } }, { timestamps: true });
const doctorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  specialization: { type: String, required: true, trim: true }, avgConsultTime: { type: Number, default: 10, min: 1, max: 120 },
  availability: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }, isActive: { type: Boolean, default: true }
}, { timestamps: true });
const appointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, timeSlot: { type: String, required: true }, tokenNumber: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'], default: 'waiting' },
  notified: { type: Boolean, default: false }, calledAt: Date, completedAt: Date
}, { timestamps: true });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1, tokenNumber: 1 }, { unique: true });
appointmentSchema.index({ patientId: 1, doctorId: 1, date: 1, status: 1 });
const queueSchema = new Schema({ doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true }, date: { type: String, required: true }, currentToken: { type: Number, default: 0 }, totalTokens: { type: Number, default: 0 } }, { timestamps: true });
queueSchema.index({ doctorId: 1, date: 1 }, { unique: true });
module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Department: mongoose.models.Department || mongoose.model('Department', departmentSchema),
  Doctor: mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema),
  Appointment: mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema),
  Queue: mongoose.models.Queue || mongoose.model('Queue', queueSchema)
};
