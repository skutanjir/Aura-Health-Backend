import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

export function errorHandler(err, req, res, _next) {
  logger.error(err);

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada (duplikat)',
    });
  }

  // Prisma not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan',
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Terjadi kesalahan server'
    : err.message || 'Terjadi kesalahan server';

  res.status(statusCode).json({ success: false, message });
}
