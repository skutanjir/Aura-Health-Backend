import { prisma } from '../config/db.js';

export const notificationRepository = {
  async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const [items, total, unread] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unread };
  },

  async create(data) {
    return prisma.notification.create({ data });
  },

  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async markOneRead(id, userId) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },
};
