import { prisma } from '../config/db.js';

export const postRepository = {
  async findMany({ page = 1, limit = 10, userId }) {
    const where = userId ? { userId } : {};
    const [items, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    return { items, total };
  },

  async findById(id) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  },

  async create(data) {
    return prisma.post.create({
      data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  },

  async delete(id) {
    return prisma.post.delete({ where: { id } });
  },

  async findByIdAndUserId(id, userId) {
    return prisma.post.findFirst({ where: { id, userId } });
  },
};
