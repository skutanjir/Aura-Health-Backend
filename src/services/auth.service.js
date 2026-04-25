import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword, generateOTP } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTTL } from '../utils/jwt.js';
import { getRedis, safeRedisGet, safeRedisSetex, safeRedisDel, isRedisAvailable, REDIS_KEYS } from '../config/redis.js';
import { env } from '../config/env.js';

export const authService = {
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email sudah terdaftar');
      err.statusCode = 409;
      throw err;
    }

    const hashed = await hashPassword(password);
    const user = await userRepository.create({ name, email, password: hashed });
    return { id: user.id, name: user.name, email: user.email };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Email atau password salah');
      err.statusCode = 401;
      throw err;
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      const err = new Error('Email atau password salah');
      err.statusCode = 401;
      throw err;
    }

    const payload = { id: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token in Redis if available
    await safeRedisSetex(REDIS_KEYS.refreshToken(user.id), getRefreshTTL(), refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    };
  },

  async refresh(refreshToken) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Refresh token tidak valid atau kadaluarsa');
      err.statusCode = 401;
      throw err;
    }

    // If Redis available, validate stored token
    if (isRedisAvailable()) {
      const stored = await safeRedisGet(REDIS_KEYS.refreshToken(payload.id));
      if (stored && stored !== refreshToken) {
        const err = new Error('Refresh token tidak valid');
        err.statusCode = 401;
        throw err;
      }
    }

    const newAccessToken = signAccessToken({ id: payload.id, email: payload.email });
    const newRefreshToken = signRefreshToken({ id: payload.id, email: payload.email });
    await safeRedisSetex(REDIS_KEYS.refreshToken(payload.id), getRefreshTTL(), newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(userId, accessJti) {
    if (accessJti) {
      await safeRedisSetex(REDIS_KEYS.blacklist(accessJti), 15 * 60, '1');
    }
    await safeRedisDel(REDIS_KEYS.refreshToken(userId));
  },

  async generateOtp(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Email tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    const otp = generateOTP();
    await safeRedisSetex(REDIS_KEYS.otp(email), parseInt(env.OTP_EXPIRES_SECONDS), otp);
    return otp;
  },

  async verifyOtp(email, otp) {
    const stored = await safeRedisGet(REDIS_KEYS.otp(email));
    if (!stored || stored !== otp) {
      const err = new Error('OTP tidak valid atau kadaluarsa');
      err.statusCode = 400;
      throw err;
    }
    await safeRedisDel(REDIS_KEYS.otp(email));
    return true;
  },
};
