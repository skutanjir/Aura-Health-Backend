import { Router } from 'express';
import multer from 'multer';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import { updateProfileSchema } from '../validations/post.validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(authenticate);

router.get('/me', userController.getMyProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.post('/me/avatar', uploadLimiter, upload.single('avatar'), userController.uploadAvatar);
router.get('/:userId', userController.getPublicProfile);

export default router;
