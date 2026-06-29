const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const problemsRoutes = require('./routes/problems');
const employeeRoutes = require('./routes/employees');
const reportRoutes = require('./routes/reports');
const holidayRoutes = require('./routes/holiday');
const onboardingRoutes = require('./routes/onboarding');
const salaryRoutes = require('./routes/salary');
const taskRoutes = require('./routes/tasks');
const settingsRoutes = require('./routes/settings');
const approvalsRoutes = require('./routes/approvals');

const app = express();

// Cloud Run runs behind a proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Gzip compression
app.use(compression());

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

let lastCrashError = null;

process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
  lastCrashError = err;
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
  lastCrashError = reason;
});

app.get('/api/debug-crash', (req, res) => {
  if (lastCrashError) {
    res.json({ error: lastCrashError.message || String(lastCrashError), stack: lastCrashError.stack });
  } else {
    res.json({ status: 'No crashes detected' });
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', async (req, res) => {
  const prisma = require('../prisma/client');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Connected to PostgreSQL' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/resignations', require('./routes/resignations'));
app.use('/api/recruitment', require('./routes/recruitment'));

// Fallback for Vercel Serverless where /api prefix is stripped from req.url
app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/reports', reportRoutes);
app.use('/holidays', holidayRoutes);
app.use('/salary', salaryRoutes);
app.use('/tasks', taskRoutes);
app.use('/settings', settingsRoutes);
app.use('/leaves', leaveRoutes);
app.use('/problems', problemsRoutes);
app.use('/employees', employeeRoutes);
app.use('/approvals', approvalsRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/resignations', require('./routes/resignations'));
app.use('/recruitment', require('./routes/recruitment'));


app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  if (
    err?.code === 'ECONNREFUSED' ||
    err?.message?.includes('connect ECONNREFUSED') ||
    err?.message?.includes('Firestore') ||
    err?.message?.includes('RESOURCE_EXHAUSTED') ||
    err?.message?.includes('quota')
  ) {
    return res.status(503).json({ error: 'Database temporarily unavailable' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
