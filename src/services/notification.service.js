import { notificationRepository } from '../repositories/notification.repository.js';
import { safeRedisPublish, REDIS_KEYS } from '../config/redis.js';

export const notificationService = {
  async create(userId, { message, type = 'general' }) {
    const notif = await notificationRepository.create({ userId, message, type });

    // Publish to Redis pub/sub (non-blocking, safe)
    await safeRedisPublish(
      REDIS_KEYS.pubsub.notification,
      JSON.stringify({ userId, notification: notif })
    );

    return notif;
  },

  async getNotifications(userId, { page = 1, limit = 20 } = {}) {
    return notificationRepository.findByUserId(userId, { page, limit });
  },

  async markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
  },

  async markOneRead(notifId, userId) {
    await notificationRepository.markOneRead(notifId, userId);
  },
};
