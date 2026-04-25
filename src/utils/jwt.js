import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, jti: uuidv4() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, jti: uuidv4() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function decodeToken(token) {
  return jwt.decode(token);
}

export function getRefreshTTL() {
  // 7 days in seconds
  return 7 * 24 * 60 * 60;
}
