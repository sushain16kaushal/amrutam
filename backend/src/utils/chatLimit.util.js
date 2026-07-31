import redis from '../config/redis.js';

const DAILY_MESSAGE_LIMIT = 50; // per-user, across saari AI-doctor consultations

const todayKey = (userId) => `chat_count:${userId}:${new Date().toISOString().slice(0, 10)}`;
const lockKey = (userId) => `chat_locked:${userId}`;

// Har naye message se pehle yeh check karo
export const isChatLocked = async (userId) => {
  const locked = await redis.get(lockKey(userId));
  return locked === '1';
};

// Message allow hone ke baad yeh call karo — count badhata hai, limit-cross
// hone pe khud hi lock laga deta hai
export const registerMessageAndCheckLimit = async (userId) => {
  const key = todayKey(userId);
  const count = await redis.incr(key);

  if (count === 1) {
    // Aaj ka pehla message — TTL set karo taaki key apne aap midnight pe expire ho jaaye
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.ceil((midnight - now) / 1000);
    await redis.expire(key, ttlSeconds);
  }

  if (count > DAILY_MESSAGE_LIMIT) {
    await redis.set(lockKey(userId), '1'); // koi expiry nahi — admin unlock tak locked rahega
    return { allowed: false, count };
  }

  return { allowed: true, count };
};

// Admin-unlock endpoint isko call karega
export const unlockChat = async (userId) => {
  await redis.del(lockKey(userId));
};
