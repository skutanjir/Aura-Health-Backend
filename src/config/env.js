import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  SUPABASE_BUCKET_AVATARS: z.string().default('avatars'),
  SUPABASE_BUCKET_POSTS: z.string().default('posts'),

  AI_PROVIDER: z.enum(['auto', 'openrouter', 'groq', 'huggingface', 'gemini', 'mock']).default('auto'),
  AI_OPENROUTER_KEY: z.string().optional(),
  AI_OPENROUTER_MODEL: z.string().default('meta-llama/llama-3-8b-instruct'),
  AI_GROQ_KEY: z.string().optional(),
  AI_GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
  AI_HF_KEY: z.string().optional(),
  AI_HF_MODEL: z.string().default('mistralai/Mistral-7B-Instruct-v0.2'),
  
  // Gemini Keys (Up to 10 keys for rotation)
  AI_GEMINI_MODEL: z.string().default('gemini-flash-lite-latest'),
  AI_GEMINI_KEY_1: z.string().optional(),
  AI_GEMINI_KEY_2: z.string().optional(),
  AI_GEMINI_KEY_3: z.string().optional(),
  AI_GEMINI_KEY_4: z.string().optional(),
  AI_GEMINI_KEY_5: z.string().optional(),
  AI_GEMINI_KEY_6: z.string().optional(),
  AI_GEMINI_KEY_7: z.string().optional(),
  AI_GEMINI_KEY_8: z.string().optional(),
  AI_GEMINI_KEY_9: z.string().optional(),
  AI_GEMINI_KEY_10: z.string().optional(),

  OTP_EXPIRES_SECONDS: z.string().default('300'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
