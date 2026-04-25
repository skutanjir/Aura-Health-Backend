import { postRepository } from '../repositories/post.repository.js';
import { commentRepository } from '../repositories/comment.repository.js';
import { likeRepository } from '../repositories/like.repository.js';
import { notificationService } from './notification.service.js';
import { uploadToSupabase, validateImageFile } from '../config/supabase.js';
import { safeRedisGet, safeRedisSetex, safeRedisDel, getRedis, isRedisAvailable, REDIS_KEYS } from '../config/redis.js';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

const FEED_CACHE_TTL = 60 * 2; // 2 minutes

export const postService = {
  async getFeed({ page = 1, limit = 10 } = {}) {
    const cacheKey = REDIS_KEYS.postFeed(page);
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const { items, total } = await postRepository.findMany({ page, limit });
    const result = {
      posts: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await safeRedisSetex(cacheKey, FEED_CACHE_TTL, JSON.stringify(result));
    return result;
  },

  async getPostById(id) {
    const post = await postRepository.findById(id);
    if (!post) {
      const err = new Error('Post tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    return post;
  },

  async createPost(userId, { content }, file) {
    let imageUrl = null;

    if (file) {
      validateImageFile(file.mimetype, file.size);
      const ext = file.mimetype.split('/')[1];
      const path = `${userId}/${uuidv4()}.${ext}`;
      imageUrl = await uploadToSupabase(env.SUPABASE_BUCKET_POSTS, path, file.buffer, file.mimetype);
    }

    const post = await postRepository.create({ userId, content, image: imageUrl });

    // Invalidate feed cache
    if (isRedisAvailable()) {
      try {
        const keys = await getRedis().keys('feed:*');
        if (keys.length) await getRedis().del(...keys);
      } catch {}
    }

    return post;
  },

  async deletePost(postId, userId) {
    const post = await postRepository.findByIdAndUserId(postId, userId);
    if (!post) {
      const err = new Error('Post tidak ditemukan atau bukan milik Anda');
      err.statusCode = 403;
      throw err;
    }
    await postRepository.delete(postId);

    if (isRedisAvailable()) {
      try {
        const keys = await getRedis().keys('feed:*');
        if (keys.length) await getRedis().del(...keys);
      } catch {}
    }
  },

  async likePost(postId, userId) {
    const post = await postRepository.findById(postId);
    if (!post) {
      const err = new Error('Post tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    const existing = await likeRepository.findByPostAndUser(postId, userId);
    if (existing) {
      await likeRepository.delete(postId, userId);
      const count = await likeRepository.countByPost(postId);
      return { liked: false, likeCount: count };
    }

    await likeRepository.create({ postId, userId });
    const count = await likeRepository.countByPost(postId);

    if (post.userId !== userId) {
      await notificationService.create(post.userId, {
        message: 'Seseorang menyukai postingan Anda',
        type: 'like',
      });
    }

    return { liked: true, likeCount: count };
  },

  async getComments(postId, { page, limit }) {
    const post = await postRepository.findById(postId);
    if (!post) {
      const err = new Error('Post tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    return commentRepository.findByPostId(postId, { page, limit });
  },

  async addComment(postId, userId, { comment }) {
    const post = await postRepository.findById(postId);
    if (!post) {
      const err = new Error('Post tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    const created = await commentRepository.create({ postId, userId, comment });

    if (post.userId !== userId) {
      await notificationService.create(post.userId, {
        message: 'Seseorang mengomentari postingan Anda',
        type: 'comment',
      });
    }

    return created;
  },

  async deleteComment(commentId, userId) {
    const comment = await commentRepository.findByIdAndUserId(commentId, userId);
    if (!comment) {
      const err = new Error('Komentar tidak ditemukan atau bukan milik Anda');
      err.statusCode = 403;
      throw err;
    }
    await commentRepository.delete(commentId);
  },
};
