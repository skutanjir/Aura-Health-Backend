import { articleRepository } from '../repositories/article.repository.js';
import { safeRedisGet, safeRedisSetex, safeRedisDel, REDIS_KEYS } from '../config/redis.js';

const CACHE_TTL = 60 * 10;

export const articleService = {
  async getArticles({ page = 1, limit = 10, category, userId } = {}) {
    const cacheKey = REDIS_KEYS.articleList(page, category);

    if (!userId) {
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const { items, total } = await articleRepository.findMany({ page, limit, category, userId });
    const result = {
      articles: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    if (!userId) {
      await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return result;
  },

  async getArticleById(id, userId) {
    if (!userId) {
      const cacheKey = REDIS_KEYS.articleDetail(id);
      const cached = await safeRedisGet(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const article = await articleRepository.findById(id, userId);
    if (!article) {
      const err = new Error('Artikel tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    if (!userId) {
      await safeRedisSetex(REDIS_KEYS.articleDetail(id), CACHE_TTL, JSON.stringify(article));
    }

    return article;
  },

  async getCategories() {
    return articleRepository.getCategories();
  },

  async likeArticle(id, userId) {
    const article = await articleRepository.findById(id, userId);
    if (!article) {
      const err = new Error('Artikel tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    const result = await articleRepository.toggleLike(id, userId);

    await safeRedisDel(REDIS_KEYS.articleDetail(id));

    return result;
  },
};
