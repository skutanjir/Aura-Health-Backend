import { prisma } from '../config/db.js';
import { safeRedisGet, safeRedisSetex, REDIS_KEYS } from '../config/redis.js';

const CACHE_TTL = 60 * 30; // 30 minutes

export const educationService = {
  async getCategories() {
    const cacheKey = 'education:categories';
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await prisma.educationContent.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    const categories = result.map((r) => ({ category: r.category, count: r._count.category }));

    await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(categories));
    return categories;
  },

  async getContentByCategory(category) {
    const cacheKey = REDIS_KEYS.educationList(category);
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = category && category !== 'all' ? { category } : {};
    const items = await prisma.educationContent.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(items));
    return items;
  },

  async getContentById(id) {
    const item = await prisma.educationContent.findUnique({ where: { id } });
    if (!item) {
      const err = new Error('Konten edukasi tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    return item;
  },
};
