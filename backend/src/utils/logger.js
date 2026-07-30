import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }) // "info" string ki jagah number nahi, readable
  },
  timestamp: pino.stdTimeFunctions.isoTime
  // Koi transport nahi — hamesha plain structured JSON, chahe dev ho ya production.
  // Wajah: pino-pretty ek extra dependency hai jo Docker image mein missing thi aur
  // container ko crash-loop kara rahi thi. Plain JSON log aggregators (Loki/ELK/CloudWatch)
  // ke liye anyway better practice hai, aur terminal mein bhi readable hai (ek line per log).
});

export default logger;