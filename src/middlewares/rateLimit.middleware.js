import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

function makeStore() {
  try {
    const redis = getRedis();
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    });
  } catch {
    return undefined; // fallback to in-memory
  }
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, message: 'Terlalu banyak permintaan chat, tunggu sebentar' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, message: 'Terlalu banyak upload, coba lagi dalam 1 jam' },
});
