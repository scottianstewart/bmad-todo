import supertest from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

describe('resolveOwner middleware', () => {
  it('sets req.owner to anonymous on /api routes', async () => {
    const app = createApp();

    app.get('/api/test-owner', (req, res) => {
      res.json({ owner: (req as unknown as { owner: string }).owner });
    });

    const response = await supertest(app).get('/api/test-owner');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ owner: 'anonymous' });
  });
});
