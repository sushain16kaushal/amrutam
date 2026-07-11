import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }) // "info" string ki jagah number nahi, readable
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } } // local dev mein readable colored logs
    : undefined // production mein raw JSON (log aggregators — Loki/ELK — isko parse karte hain)
});

export default logger;