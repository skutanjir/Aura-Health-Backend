import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redis;
let redisAvailable = false;

export function isRedisAvailable() {
  return redisAvailable;
}

export function getRedis() {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null; // stop retrying quickly
        return Math.min(times * 500, 1000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => { redisAvailable = true; logger.info('Redis connected'); });
    redis.on('error', (err) => { redisAvailable = false; logger.error('Redis error:', err.message); });
    redis.on('close', () => { redisAvailable = false; logger.warn('Redis connection closed'); });
  }
  return redis;
}

export async function connectRedis() {
  const r = getRedis();
  await r.connect();
  redisAvailable = true;
  return r;
}

// Safe wrapper — returns null instead of throwing when Redis is down
export async function safeRedisGet(key) {
  if (!redisAvailable) return null;
  try { return await getRedis().get(key); } catch { return null; }
}

export async function safeRedisSetex(key, ttl, value) {
  if (!redisAvailable) return;
  try { await getRedis().setex(key, ttl, value); } catch {}
}

export async function safeRedisDel(...keys) {
  if (!redisAvailable || !keys.length) return;
  try { await getRedis().del(...keys); } catch {}
}

export async function safeRedisPublish(channel, message) {
  if (!redisAvailable) return;
  try { await getRedis().publish(channel, message); } catch {}
}

export const REDIS_KEYS = {
  refreshToken: (userId) => `refresh:${userId}`,
  blacklist: (jti) => `blacklist:${jti}`,
  otp: (email) => `otp:${email}`,
  rateLimit: (ip) => `rl:${ip}`,
  articleList: (page, category) => `articles:${category ?? 'all'}:${page}`,
  articleDetail: (id) => `article:${id}`,
  educationList: (category) => `education:${category ?? 'all'}`,
  postFeed: (page) => `feed:${page}`,
  notifications: (userId) => `notif:${userId}`,
  chatHistory: (userId) => `chat:${userId}`,
  pubsub: {
    notification: 'channel:notification',
  },
};
