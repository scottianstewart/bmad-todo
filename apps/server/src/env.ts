import { z } from 'zod';

const DEV_DATABASE_URL_DEFAULT = 'postgresql://todo:todo@localhost:5433/todo';

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3001),
  BIND: z.string().default('127.0.0.1'),
  ALLOW_PUBLIC_BIND: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = Omit<z.infer<typeof envSchema>, 'DATABASE_URL'> & {
  DATABASE_URL: string;
};

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  const parsed = result.data;

  let databaseUrl = parsed.DATABASE_URL;
  if (!databaseUrl) {
    if (parsed.NODE_ENV === 'production') {
      throw new Error(
        'Invalid environment variables:\n  DATABASE_URL: required in production',
      );
    }
    databaseUrl = DEV_DATABASE_URL_DEFAULT;
  }

  return { ...parsed, DATABASE_URL: databaseUrl };
}
