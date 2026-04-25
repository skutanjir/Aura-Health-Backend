import { prisma } from '../config/db.js';

export const chatRepository = {
  async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const [items, total] = await prisma.$transaction([
      prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatHistory.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  async create(data) {
    return prisma.chatHistory.create({ data });
  },

  async deleteByUserId(userId) {
    return prisma.chatHistory.deleteMany({ where: { userId } });
  },
};
