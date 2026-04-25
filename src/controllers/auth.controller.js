import { authService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return successResponse(res, 'Registrasi berhasil', user, 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, 'Login berhasil', result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      return successResponse(res, 'Token diperbarui', tokens);
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      let jti;
      try {
        const payload = verifyAccessToken(token);
        jti = payload.jti;
      } catch {
        jti = null;
      }
      await authService.logout(req.user.id, jti);
      return successResponse(res, 'Logout berhasil');
    } catch (err) {
      next(err);
    }
  },

  async requestOtp(req, res, next) {
    try {
      const { email } = req.body;
      const otp = await authService.generateOtp(email);
      // In production: send via email. For dev, return in response.
      return successResponse(res, 'OTP berhasil dikirim', { otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      await authService.verifyOtp(email, otp);
      return successResponse(res, 'OTP valid');
    } catch (err) {
      next(err);
    }
  },
};
