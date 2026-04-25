import { Router } from 'express';
import { educationController } from '../controllers/education.controller.js';

const router = Router();

router.get('/categories', educationController.getCategories);
router.get('/category/:category', educationController.getContentByCategory);
router.get('/:id', educationController.getContentById);

export default router;
