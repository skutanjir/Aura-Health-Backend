import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, getRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { mkdirSync } from 'fs';

// Ensure logs directory exists
try { mkdirSync('logs', { recursive: true }); } catch {}

async function bootstrap() {
  try {
    // Connect database
    await connectDB();
    logger.info('Database connected');

    // Connect Redis (non-fatal — server starts even if Redis is down)
    try {
      await connectRedis();
      logger.info('Redis connected');
    } catch (redisErr) {
      logger.warn(`Redis unavailable — running without cache/session features: ${redisErr.message}`);
    }

    const port = parseInt(env.PORT, 10);
    const server = app.listen(port, () => {
      logger.info(`🚀 Aura Health API running on port ${port} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await disconnectDB();
        const redis = getRedis();
        await redis.quit();
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
