import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

describe('security middleware', () => {
  it('applies helmet headers to responses', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('CORS allowlists the configured origin', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('CORS rejects an unlisted origin', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects bodies larger than the 8kb limit with 413', async () => {
    const app = createApp();
    const huge = { payload: 'x'.repeat(10_000) };
    const res = await request(app).post('/api/health').send(huge);

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
