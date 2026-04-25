import { notificationService } from '../services/notification.service.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await notificationService.getNotifications(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return paginatedResponse(res, 'Notifikasi berhasil diambil', result.items, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        unread: result.unread,
        totalPages: Math.ceil(result.total / parseInt(limit)),
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllRead(req.user.id);
      return successResponse(res, 'Semua notifikasi ditandai telah dibaca');
    } catch (err) {
      next(err);
    }
  },

  async markOneRead(req, res, next) {
    try {
      await notificationService.markOneRead(req.params.id, req.user.id);
      return successResponse(res, 'Notifikasi ditandai telah dibaca');
    } catch (err) {
      next(err);
    }
  },
};
