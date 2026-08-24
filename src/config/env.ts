import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
