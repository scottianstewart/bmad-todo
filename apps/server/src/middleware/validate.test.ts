import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from './error-handler.js';
import { validate } from './validate.js';

describe('validate factory', () => {
  it('passes a valid body and normalizes the parsed shape', async () => {
    const app = express();
    app.use(express.json());
    const schema = z.object({ title: z.string().min(1) });
    app.post('/x', validate(schema), (req, res) => {
      res.json(req.body);
    });

    const res = await request(app).post('/x').send({ title: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ title: 'hi' });
  });

  it('rejects an invalid body with 400 + VALIDATION_FAILED', async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'log', {
        value: { error: () => {}, info: () => {}, warn: () => {}, debug: () => {} },
        writable: true,
      });
      next();
    });
    const schema = z.object({ title: z.string().min(1) });
    app.post('/x', validate(schema), (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);

    const res = await request(app).post('/x').send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('validates query params with source = query', async () => {
    const app = express();
    const schema = z.object({ q: z.string().min(1) });
    app.get('/x', validate(schema, 'query'), (req, res) => {
      res.json({ q: req.query['q'] });
    });

    const ok = await request(app).get('/x').query({ q: 'hi' });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ q: 'hi' });
  });

  it('validates path params with source = params', async () => {
    const app = express();
    app.use((req, _res, next) => {
      Object.defineProperty(req, 'log', {
        value: { error: () => {}, info: () => {}, warn: () => {}, debug: () => {} },
        writable: true,
      });
      next();
    });
    const schema = z.object({ id: z.string().uuid() });
    app.get('/x/:id', validate(schema, 'params'), (req, res) => {
      res.json({ id: req.params['id'] });
    });
    app.use(errorHandler);

    const bad = await request(app).get('/x/not-a-uuid');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_FAILED');
  });
});
