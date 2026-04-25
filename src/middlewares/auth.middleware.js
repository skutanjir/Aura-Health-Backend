import { verifyAccessToken } from '../utils/jwt.js';
import { safeRedisGet, REDIS_KEYS } from '../config/redis.js';
import { errorResponse } from '../utils/response.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 'Token tidak ditemukan', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    // Check blacklist (safe — skips if Redis is down)
    const isBlacklisted = await safeRedisGet(REDIS_KEYS.blacklist(payload.jti));
    if (isBlacklisted) {
      return errorResponse(res, 'Token tidak valid', 401);
    }

    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token kadaluarsa', 401);
    }
    return errorResponse(res, 'Token tidak valid', 401);
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, email: payload.email };
  } catch {
    // silently ignore
  }
  next();
}
