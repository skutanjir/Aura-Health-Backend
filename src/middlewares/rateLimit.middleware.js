import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, isRedisAvailable } from '../config/redis.js';

function makeStore() {
  const redis = getRedis();
  return new RedisStore({
    sendCommand: async (...args) => {
      if (!isRedisAvailable()) {
        // Fallback untuk menghindari crash saat script load jika Redis offline
        if (args[0] === 'SCRIPT') return 'fallback_sha';
        if (args[0] === 'EVALSHA') return [1, 60000]; 
        return null;
      }
      try {
        return await redis.call(...args);
      } catch (err) {
        if (args[0] === 'SCRIPT') return 'fallback_sha';
        if (args[0] === 'EVALSHA') return [1, 60000];
        return null;
      }
    },
  });
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  validate: false,
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  validate: false,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  validate: false,
  message: { success: false, message: 'Terlalu banyak permintaan chat, tunggu sebentar' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  validate: false,
  message: { success: false, message: 'Terlalu banyak upload, coba lagi dalam 1 jam' },
});
