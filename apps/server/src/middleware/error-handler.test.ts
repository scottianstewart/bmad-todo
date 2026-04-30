import express from 'express';
import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError } from '../lib/errors.js';

import { errorHandler } from './error-handler.js';
import { validate } from './validate.js';

function buildApp(routeBuilder: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.defineProperty(req, 'log', {
      value: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
      writable: true,
    });
    next();
  });
  routeBuilder(app);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('translates ApiError to status + envelope', async () => {
    const app = buildApp((a) =>
      a.get('/throw', (_req, _res, next) => {
        next(new ApiError('not found', 'TODO_NOT_FOUND', 404));
      }),
    );

    const res = await request(app).get('/throw');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { message: 'not found', code: 'TODO_NOT_FOUND' },
    });
  });

  it('translates ZodError to 400 + VALIDATION_FAILED', async () => {
    const schema = z.object({ title: z.string().min(1) });
    const app = buildApp((a) =>
      a.post('/v', validate(schema), (_req, res) => res.json({ ok: true })),
    );

    const res = await request(app).post('/v').send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { message: 'Request validation failed', code: 'VALIDATION_FAILED' },
    });
  });

  it('translates generic Error to 500 + INTERNAL with generic message', async () => {
    const app = buildApp((a) =>
      a.get('/oops', (_req, _res, next) => {
        next(new Error('secret internal detail'));
      }),
    );

    const res = await request(app).get('/oops');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
  });
});
