import { postService } from '../services/post.service.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const postController = {
  async getFeed(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await postService.getFeed({ page: parseInt(page), limit: parseInt(limit), userId: req.user?.id });
      return paginatedResponse(res, 'Feed berhasil diambil', result.posts, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getPostById(req, res, next) {
    try {
      const post = await postService.getPostById(req.params.id, req.user?.id);
      return successResponse(res, 'Post berhasil diambil', post);
    } catch (err) {
      next(err);
    }
  },

  async createPost(req, res, next) {
    try {
      const post = await postService.createPost(req.user.id, req.body, req.file);
      const io = req.app.get('io');
      if (io) io.emit('post_created', { post });
      return successResponse(res, 'Post berhasil dibuat', post, 201);
    } catch (err) {
      next(err);
    }
  },

  async deletePost(req, res, next) {
    try {
      await postService.deletePost(req.params.id, req.user.id);
      const io = req.app.get('io');
      if (io) io.emit('post_deleted', { postId: req.params.id });
      return successResponse(res, 'Post berhasil dihapus');
    } catch (err) {
      next(err);
    }
  },

  async updatePost(req, res, next) {
    try {
      const post = await postService.updatePost(req.params.id, req.user.id, req.body);
      const io = req.app.get('io');
      if (io) io.emit('post_updated', { post });
      return successResponse(res, 'Post berhasil diperbarui', post);
    } catch (err) {
      next(err);
    }
  },

  async likePost(req, res, next) {
    try {
      const result = await postService.likePost(req.params.id, req.user.id);
      const io = req.app.get('io');
      if (io) io.emit('post_liked', { postId: req.params.id, likesCount: result.likeCount });
      return successResponse(res, result.liked ? 'Post disukai' : 'Like dihapus', result);
    } catch (err) {
      next(err);
    }
  },

  async getComments(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await postService.getComments(req.params.id, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      return paginatedResponse(res, 'Komentar berhasil diambil', result.items, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit)),
      });
    } catch (err) {
      next(err);
    }
  },

  async addComment(req, res, next) {
    try {
      const comment = await postService.addComment(req.params.id, req.user.id, req.body);
      
      // Emit Realtime event
      const io = req.app.get('io');
      if (io) {
        io.emit('comment_created', {
          postId: req.params.id,
          comment: comment
        });
      }

      return successResponse(res, 'Komentar berhasil ditambahkan', comment, 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req, res, next) {
    try {
      await postService.deleteComment(req.params.commentId, req.user.id);
      const io = req.app.get('io');
      if (io) io.emit('comment_deleted', { postId: req.params.id, commentId: req.params.commentId });
      return successResponse(res, 'Komentar berhasil dihapus');
    } catch (err) {
      next(err);
    }
  },
};
