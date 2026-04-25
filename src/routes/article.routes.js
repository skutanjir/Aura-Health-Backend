import { Router } from 'express';
import { articleController } from '../controllers/article.controller.js';

const router = Router();

router.get('/', articleController.getArticles);
router.get('/categories', articleController.getCategories);
router.get('/:id', articleController.getArticleById);

export default router;
