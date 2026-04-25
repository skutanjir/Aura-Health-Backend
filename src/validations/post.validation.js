import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Konten tidak boleh kosong').max(2000, 'Konten maksimal 2000 karakter'),
});

export const createCommentSchema = z.object({
  comment: z.string().min(1, 'Komentar tidak boleh kosong').max(500, 'Komentar maksimal 500 karakter'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(1000, 'Pesan maksimal 1000 karakter'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
});
