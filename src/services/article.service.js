import { articleRepository } from '../repositories/article.repository.js';
import { safeRedisGet, safeRedisSetex, REDIS_KEYS } from '../config/redis.js';

const CACHE_TTL = 60 * 10; // 10 minutes

export const articleService = {
  async getArticles({ page = 1, limit = 10, category } = {}) {
    const cacheKey = REDIS_KEYS.articleList(page, category);
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const { items, total } = await articleRepository.findMany({ page, limit, category });
    const result = {
      articles: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  },

  async getArticleById(id) {
    const cacheKey = REDIS_KEYS.articleDetail(id);
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const article = await articleRepository.findById(id);
    if (!article) {
      const err = new Error('Artikel tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(article));
    return article;
  },

  async getCategories() {
    return articleRepository.getCategories();
  },
};
