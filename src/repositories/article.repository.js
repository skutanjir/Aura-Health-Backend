import { prisma } from '../config/db.js';

export const articleRepository = {
  async findMany({ page = 1, limit = 10, category, userId }) {
    const where = category ? { category } : {};
    const [items, total] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, summary: true, imageUrl: true,
          category: true, author: true, publishedAt: true, likesCount: true,
          articleLikes: userId
            ? { where: { userId }, select: { id: true } }
            : false,
        },
      }),
      prisma.article.count({ where }),
    ]);

    const mapped = items.map(({ articleLikes, ...a }) => ({
      ...a,
      isLiked: userId ? (articleLikes?.length > 0) : false,
    }));

    return { items: mapped, total };
  },

  async findById(id, userId) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: userId
        ? { articleLikes: { where: { userId }, select: { id: true } } }
        : false,
    });
    if (!article) return null;
    const { articleLikes, ...rest } = article;
    return { ...rest, isLiked: userId ? (articleLikes?.length > 0) : false };
  },

  async create(data) {
    return prisma.article.create({ data });
  },

  async toggleLike(articleId, userId) {
    const existing = await prisma.articleLike.findUnique({
      where: { articleId_userId: { articleId, userId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.articleLike.delete({
          where: { articleId_userId: { articleId, userId } },
        }),
        prisma.article.update({
          where: { id: articleId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      const article = await this.findById(articleId, userId);
      return { article, liked: false };
    } else {
      await prisma.$transaction([
        prisma.articleLike.create({ data: { articleId, userId } }),
        prisma.article.update({
          where: { id: articleId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      const article = await this.findById(articleId, userId);
      return { article, liked: true };
    }
  },

  async getCategories() {
    const result = await prisma.article.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    return result.map((r) => ({ category: r.category, count: r._count.category }));
  },
};
