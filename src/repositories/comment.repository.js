import { prisma } from '../config/db.js';

export const commentRepository = {
  async findByPostId(postId, { page = 1, limit = 20 } = {}) {
    const [items, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);
    return { items, total };
  },

  async create(data) {
    return prisma.comment.create({
      data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  },

  async delete(id) {
    return prisma.comment.delete({ where: { id } });
  },

  async findByIdAndUserId(id, userId) {
    return prisma.comment.findFirst({ where: { id, userId } });
  },
};
