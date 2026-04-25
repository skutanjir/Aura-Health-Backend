import { educationService } from '../services/education.service.js';
import { successResponse } from '../utils/response.js';

export const educationController = {
  async getCategories(req, res, next) {
    try {
      const categories = await educationService.getCategories();
      return successResponse(res, 'Kategori edukasi berhasil diambil', categories);
    } catch (err) {
      next(err);
    }
  },

  async getContentByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const items = await educationService.getContentByCategory(category);
      return successResponse(res, 'Konten edukasi berhasil diambil', items);
    } catch (err) {
      next(err);
    }
  },

  async getContentById(req, res, next) {
    try {
      const item = await educationService.getContentById(req.params.id);
      return successResponse(res, 'Konten edukasi berhasil diambil', item);
    } catch (err) {
      next(err);
    }
  },
};
