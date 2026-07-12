import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import usersRoutes from './modules/users/users.routes.js';
import doctorsRoutes from './modules/doctors/doctors.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import consultationsRoutes from './modules/consultations/consultations.routes.js';
import prescriptionsRoutes from './modules/prescriptions/prescriptions.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import { generalLimiter, authLimiter } from './middlewares/rateLimiter.middleware.js';
import pinoHttp from 'pino-http';
import logger from './utils/logger.js';
import { requestId } from './middlewares/requestId.middleware.js';
import register, { httpRequestDuration } from './utils/metrics.js';
const app = express();
app.use(helmet()); 
app.use(cors()); 
app.use(requestId); // pehle req.id set karo
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id, // hamara wala id use karo, naya mat banao
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  }
}));
app.use(express.json());
app.use(generalLimiter); // sabhi routes pe baseline
app.use('/api/auth', authLimiter);

app.use('/api/bookings', bookingsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/consultations/:consultationId/prescriptions', prescriptionsRoutes);
app.use('/api/auth', authRoutes);
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}` // NEW — mount prefix bhi include karo
      : req.path;
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      durationSeconds
    );
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
app.use(express.json());
app.use('/api/users', usersRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler); // hamesha sabse aakhir mein

export default app;