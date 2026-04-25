import { prisma } from '../config/db.js';

export const likeRepository = {
  async findByPostAndUser(postId, userId) {
    return prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
  },

  async create(data) {
    return prisma.like.create({ data });
  },

  async delete(postId, userId) {
    return prisma.like.delete({ where: { postId_userId: { postId, userId } } });
  },

  async countByPost(postId) {
    return prisma.like.count({ where: { postId } });
  },
};
