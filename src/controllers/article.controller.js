import { articleService } from '../services/article.service.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const articleController = {
  async getArticles(req, res, next) {
    try {
      const { page = 1, limit = 10, category } = req.query;
      const result = await articleService.getArticles({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
      });
      return paginatedResponse(res, 'Artikel berhasil diambil', result.articles, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getArticleById(req, res, next) {
    try {
      const article = await articleService.getArticleById(req.params.id);
      return successResponse(res, 'Artikel berhasil diambil', article);
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await articleService.getCategories();
      return successResponse(res, 'Kategori berhasil diambil', categories);
    } catch (err) {
      next(err);
    }
  },
};
