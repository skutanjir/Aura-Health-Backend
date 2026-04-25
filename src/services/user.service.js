import { userRepository } from '../repositories/user.repository.js';
import { uploadToSupabase, validateImageFile, deleteFromSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export const userService = {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    const { password: _, ...safe } = user;
    return safe;
  },

  async getPublicProfile(userId) {
    const user = await userRepository.findPublicById(userId);
    if (!user) {
      const err = new Error('User tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  async updateProfile(userId, data) {
    const updated = await userRepository.update(userId, data);
    const { password: _, ...safe } = updated;
    return safe;
  },

  async uploadAvatar(userId, file) {
    validateImageFile(file.mimetype, file.size);

    const ext = file.mimetype.split('/')[1];
    const path = `${userId}/${uuidv4()}.${ext}`;
    const url = await uploadToSupabase(env.SUPABASE_BUCKET_AVATARS, path, file.buffer, file.mimetype);

    await userRepository.update(userId, { avatar: url });
    return { avatarUrl: url };
  },
};
