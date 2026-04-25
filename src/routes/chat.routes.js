import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { chatLimiter } from '../middlewares/rateLimit.middleware.js';
import { chatMessageSchema } from '../validations/post.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', chatLimiter, validate(chatMessageSchema), chatController.chat);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);

export default router;
