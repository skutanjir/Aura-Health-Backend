import { chatService } from '../services/chat.service.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const chatController = {
  async chat(req, res, next) {
    try {
      const { message, latitude, longitude } = req.body;
      const location = latitude && longitude ? { latitude, longitude } : null;
      const result = await chatService.chat(req.user.id, message, location);
      return successResponse(res, 'Pesan berhasil diproses', result);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await chatService.getHistory(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return paginatedResponse(res, 'Riwayat chat berhasil diambil', result.history, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async clearHistory(req, res, next) {
    try {
      await chatService.clearHistory(req.user.id);
      return successResponse(res, 'Riwayat chat berhasil dihapus');
    } catch (err) {
      next(err);
    }
  },
};
