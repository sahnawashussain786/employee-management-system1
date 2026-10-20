import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cron from 'node-cron';

import env from './config.js';
import { connectDB } from './db.js';
import { markMissingAttendanceForDate } from './services/attendance.js';
import CompanySettings from './models/CompanySettings.js';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import leaveRoutes from './routes/leaves.js';
import attendanceRoutes from './routes/attendance.js';
import holidayRoutes from './routes/holidays.js';
import userRoutes from './routes/users.js';
import orgRoutes from './routes/org.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ---- middleware ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
}));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---- static uploads ----
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadDir));

// ---- routes ----
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/org', orgRoutes);

// ---- health ----
app.get('/api/health', (_req, res) => {
  res.json({ success: true, uptime: process.uptime(), env: env.nodeEnv });
});

// ---- error handling ----
app.use(notFound);
app.use(errorHandler);

// ---- cron: auto-mark absent for yesterday (runs at 00:05 local) ----
cron.schedule('5 0 * * *', async () => {
  try {
    const settings = await CompanySettings.getSettings();
    const result = await markMissingAttendanceForDate(new Date(), { settings });
    if (result.created) console.log(`[cron] auto-mark-absent: ${result.created} employee(s)`);
  } catch (err) {
    console.error('[cron] mark-missing failed:', err.message);
  }
});

// ---- start ----
async function start() {
  await connectDB();
  await CompanySettings.getSettings(); // ensure default settings doc exists
  app.listen(env.port, () => {
    console.log(`[api] listening on http://127.0.0.1:${env.port}`);
    console.log(`[api] environment: ${env.nodeEnv}`);
  });
}

start().catch((err) => {
  console.error('[startup] failed to start server:', err);
  process.exit(1);
});

export default app;
