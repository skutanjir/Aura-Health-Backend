import { Router } from 'express';
import { articleController } from '../controllers/article.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, articleController.getArticles);
router.get('/categories', articleController.getCategories);
router.get('/:id', optionalAuth, articleController.getArticleById);

router.post('/:id/like', authenticate, articleController.likeArticle);

export default router;
