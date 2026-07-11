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
  mfaTempTokenExpiry: '5m'
};