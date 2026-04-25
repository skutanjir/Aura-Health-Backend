import { prisma } from '../config/db.js';

export const articleRepository = {
  async findMany({ page = 1, limit = 10, category }) {
    const where = category ? { category } : {};
    const [items, total] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, summary: true, imageUrl: true,
          category: true, author: true, publishedAt: true,
        },
      }),
      prisma.article.count({ where }),
    ]);
    return { items, total };
  },

  async findById(id) {
    return prisma.article.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.article.create({ data });
  },

  async getCategories() {
    const result = await prisma.article.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    return result.map((r) => ({ category: r.category, count: r._count.category }));
  },
};
