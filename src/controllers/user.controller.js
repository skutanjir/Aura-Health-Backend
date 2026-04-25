import { userService } from '../services/user.service.js';
import { successResponse } from '../utils/response.js';

export const userController = {
  async getMyProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      return successResponse(res, 'Profil berhasil diambil', user);
    } catch (err) {
      next(err);
    }
  },

  async getPublicProfile(req, res, next) {
    try {
      const user = await userService.getPublicProfile(req.params.userId);
      return successResponse(res, 'Profil berhasil diambil', user);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      return successResponse(res, 'Profil berhasil diperbarui', user);
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File gambar wajib diunggah' });
      }
      const result = await userService.uploadAvatar(req.user.id, req.file);
      return successResponse(res, 'Avatar berhasil diunggah', result);
    } catch (err) {
      next(err);
    }
  },
};
