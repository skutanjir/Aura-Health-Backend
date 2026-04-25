import { prisma } from '../config/db.js';

export const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data) {
    return prisma.user.create({ data });
  },

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },

  async findPublicById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, avatar: true, bio: true, createdAt: true },
    });
  },
};
