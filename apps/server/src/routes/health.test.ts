import supertest from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp();
    const response = await supertest(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
