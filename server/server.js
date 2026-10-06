const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { today, isValidDateString } = require('./utils/date');
const { queueSnapshot } = require('./utils/queue');
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const queueRoutes = require('./routes/queue');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] } });
app.set('io', io);
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'MediQueue API', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected yet. Please retry shortly.' });
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

io.on('connection', socket => {
  socket.on('join', async (doctorId, acknowledge) => {
    if (typeof doctorId !== 'string' || !/^[a-f\d]{24}$/i.test(doctorId)) {
      if (typeof acknowledge === 'function') acknowledge({ error: 'Invalid doctor identifier' });
      return;
    }
    socket.join(`doctor_${doctorId}`);
    try {
      const snapshot = await queueSnapshot(doctorId, today(), false);
      socket.emit('queueUpdated', snapshot);
      if (typeof acknowledge === 'function') acknowledge({ ok: true });
    } catch (error) {
      console.error('Socket queue snapshot failed:', error);
      if (typeof acknowledge === 'function') acknowledge({ error: 'Unable to load queue' });
    }
  });
});

const port = Number(process.env.PORT || 5000);
async function start() {
  server.listen(port, () => console.log(`MediQueue API listening on port ${port}`));
  let retryDelay = 5000;
  const connectWithRetry = async () => {
    try {
      await connectDB();
      retryDelay = 5000;
    } catch (error) {
      console.error(`MongoDB connection failed; retrying in ${retryDelay / 1000} seconds:`, error.message);
      const nextDelay = retryDelay;
      retryDelay = Math.min(retryDelay * 2, 60000);
      setTimeout(connectWithRetry, nextDelay);
    }
  };
  connectWithRetry();
}
if (require.main === module) start().catch(error => { console.error('Server startup failed:', error); process.exitCode = 1; });
module.exports = { app, server, io, start };
