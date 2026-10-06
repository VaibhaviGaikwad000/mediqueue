const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const { User, Department, Doctor, Appointment, Queue } = require('./models');

async function seed() {
  await connectDB();
  await Promise.all([Appointment.deleteMany({}), Queue.deleteMany({}), Doctor.deleteMany({}), Department.deleteMany({}), User.deleteMany({})]);
  const passwordHash = async password => bcrypt.hash(password, 12);
  const [admin, patient] = await User.create([
    { name: 'MediQueue Admin', email: 'admin@mediqueue.com', password: await passwordHash('Admin@123'), role: 'admin' },
    { name: 'Demo Patient', email: 'patient@mediqueue.com', password: await passwordHash('Patient@123'), role: 'patient', phone: '9876543210' }
  ]);
  const departments = await Department.create([
    { name: 'General Medicine', description: 'Primary and general healthcare' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care' },
    { name: 'Pediatrics', description: 'Healthcare for infants and children' },
    { name: 'Orthopedics', description: 'Bone, joint and musculoskeletal care' }
  ]);
  const specializations = ['General Physician', 'Cardiologist', 'Pediatrician', 'Orthopedic Surgeon'];
  for (let index = 0; index < 4; index++) {
    const user = await User.create({
      name: `Dr. ${['Aarav Mehta', 'Diya Shah', 'Kabir Rao', 'Anaya Iyer'][index]}`,
      email: `doctor${index + 1}@mediqueue.com`,
      password: await passwordHash('Doctor@123'),
      role: 'doctor'
    });
    await Doctor.create({
      userId: user._id,
      departmentId: departments[index]._id,
      specialization: specializations[index],
      avgConsultTime: 10,
      availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      isActive: true
    });
  }
  console.log(`Seed complete: ${admin.email}, ${patient.email}; 4 departments and 4 doctors created.`);
  await require('mongoose').disconnect();
}

seed().catch(async error => {
  console.error('Seed failed:', error);
  await require('mongoose').disconnect();
  process.exitCode = 1;
});
