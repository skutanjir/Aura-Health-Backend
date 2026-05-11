import { Router } from 'express';
import multer from 'multer';
import { postController } from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import { createPostSchema, updatePostSchema, createCommentSchema } from '../validations/post.validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'image/jpeg') return cb(new Error('Hanya file JPEG yang diizinkan'));
    cb(null, true);
  },
});

// Public
router.get('/', optionalAuth, postController.getFeed);
router.get('/:id', optionalAuth, postController.getPostById);
router.get('/:id/comments', postController.getComments);

// Protected
router.post('/', authenticate, uploadLimiter, upload.single('image'), validate(createPostSchema), postController.createPost);
router.put('/:id', authenticate, validate(updatePostSchema), postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);
router.post('/:id/like', authenticate, postController.likePost);
router.post('/:id/comments', authenticate, validate(createCommentSchema), postController.addComment);
router.delete('/:id/comments/:commentId', authenticate, postController.deleteComment);

export default router;
