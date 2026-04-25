import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  otpVerifySchema,
} from '../validations/auth.validation.js';
import { z } from 'zod';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/otp/request', authLimiter, validate(z.object({ email: z.string().email() })), authController.requestOtp);
router.post('/otp/verify', authLimiter, validate(otpVerifySchema), authController.verifyOtp);

export default router;
