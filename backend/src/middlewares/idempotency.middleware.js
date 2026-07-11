import redis from '../config/redis.js';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export const idempotency = async (req, res, next) => {
  const key = req.header('Idempotency-Key');
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required for this request'
    });
  }

  const redisKey = `idempotency:${key}`;
  const cached = await redis.get(redisKey);

  if (cached) {
    const { statusCode, body } = JSON.parse(cached);
    return res.status(statusCode).json(body); // original response wapas bhej do, dubara process mat karo
  }

  // res.json ko intercept karke response cache kar lete hain jaise hi woh bheja jaaye
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) { // sirf non-server-error responses cache karo, failed retry allow karna hai
      redis.set(redisKey, JSON.stringify({ statusCode: res.statusCode, body }), 'EX', IDEMPOTENCY_TTL_SECONDS)
        .catch((err) => console.error('Idempotency cache failed:', err));
    }
    return originalJson(body);
  };

  next();
};