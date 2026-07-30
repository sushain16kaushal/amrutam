import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  encryptionKey: process.env.ENCRYPTION_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowPaymentSimulation: process.env.ALLOW_PAYMENT_SIMULATION === 'true',
  mfaTempTokenExpiry: '5m',
  resendApiKey: process.env.RESEND_API_KEY,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  groqApiKey: process.env.GROQ_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
};