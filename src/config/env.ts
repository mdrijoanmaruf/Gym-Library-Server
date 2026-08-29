import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: '.env.local', override: true });
} else {
  dotenv.config({ override: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().default('supersecret_access'),
  JWT_REFRESH_SECRET: z.string().default('supersecret_refresh'),
  ACCESS_TOKEN_EXPIRES: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES: z.string().default('30d'),
  PASSWORD_RESET_TOKEN_SECRET: z.string().default('supersecret_reset'),
  PASSWORD_RESET_EXPIRES: z.string().default('1h'),
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET_NAME: z.string().default('gym-library-media'),
  R2_PUBLIC_DOMAIN: z.string().optional(),
  PRESIGNED_URL_EXPIRES: z.string().default('3600'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
