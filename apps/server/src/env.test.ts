import { describe, expect, it } from 'vitest';

import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('returns defaults when given an empty object', () => {
    const env = parseEnv({});

    expect(env.DATABASE_URL).toBe('postgresql://todo:todo@localhost:5433/todo');
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.BIND).toBe('127.0.0.1');
    expect(env.ALLOW_PUBLIC_BIND).toBe(false);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.NODE_ENV).toBe('development');
  });

  it('parses valid overrides', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgresql://x:x@db:5432/x',
      PORT: '8080',
      BIND: '0.0.0.0',
      ALLOW_PUBLIC_BIND: 'true',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'production',
    });

    expect(env.DATABASE_URL).toBe('postgresql://x:x@db:5432/x');
    expect(env.PORT).toBe(8080);
    expect(env.BIND).toBe('0.0.0.0');
    expect(env.ALLOW_PUBLIC_BIND).toBe(true);
    expect(env.LOG_LEVEL).toBe('debug');
    expect(env.NODE_ENV).toBe('production');
  });

  it('throws on invalid LOG_LEVEL', () => {
    expect(() => parseEnv({ LOG_LEVEL: 'verbose' })).toThrow('Invalid environment variables');
  });

  it('throws on invalid NODE_ENV', () => {
    expect(() => parseEnv({ NODE_ENV: 'staging' })).toThrow('Invalid environment variables');
  });

  it('coerces PORT from string to number', () => {
    const env = parseEnv({ PORT: '9999' });
    expect(env.PORT).toBe(9999);
  });

  it('throws on non-numeric PORT', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow('Invalid environment variables');
  });

  it('throws when DATABASE_URL is missing in production', () => {
    expect(() => parseEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL: required in production/,
    );
  });

  it('uses the dev default for DATABASE_URL in development', () => {
    const env = parseEnv({ NODE_ENV: 'development' });
    expect(env.DATABASE_URL).toBe('postgresql://todo:todo@localhost:5433/todo');
  });

  it('honors a non-default DATABASE_URL in production', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://prod:secret@db.example.com:5432/app',
    });
    expect(env.DATABASE_URL).toBe('postgresql://prod:secret@db.example.com:5432/app');
  });

  it('rejects empty-string DATABASE_URL', () => {
    expect(() => parseEnv({ DATABASE_URL: '' })).toThrow('Invalid environment variables');
  });

  it('NODE_ENV=test falls through to the dev DATABASE_URL default', () => {
    const env = parseEnv({ NODE_ENV: 'test' });
    expect(env.DATABASE_URL).toBe('postgresql://todo:todo@localhost:5433/todo');
    expect(env.NODE_ENV).toBe('test');
  });
});
