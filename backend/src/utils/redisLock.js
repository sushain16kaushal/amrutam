import redis from '../config/redis.js';
import crypto from 'crypto';

const LOCK_TTL_MS = 10000; // 10 sec — booking transaction complete hone ke liye kaafi

export const acquireLock = async (resource) => {
  const lockKey = `lock:${resource}`;
  const token = crypto.randomUUID();
  // SET key value NX PX ttl — atomic "set only if not exists" + auto-expiry
  const result = await redis.set(lockKey, token, 'PX', LOCK_TTL_MS, 'NX');
  return result === 'OK' ? token : null;
};

export const releaseLock = async (resource, token) => {
  // Lua script: sirf tabhi delete karo agar value hamara hi token hai —
  // isse hum galti se kisi aur ki lock release nahi kar denge
  // (jaise agar hamari lock expire ho gayi aur koi aur naya lock le chuka ho)
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
  return redis.eval(script, 1, `lock:${resource}`, token);
};