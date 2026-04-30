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

  it('preserves a pre-existing non-empty req.owner (auth seam)', async () => {
    const { resolveOwner } = await import('./resolve-owner.js');
    let nextCalled = false;
    const next = (() => {
      nextCalled = true;
    }) as () => void;
    const req = { owner: 'user-123' } as unknown as Parameters<typeof resolveOwner>[0];
    const res = {} as unknown as Parameters<typeof resolveOwner>[1];

    resolveOwner(req, res, next);

    expect((req as unknown as { owner: string }).owner).toBe('user-123');
    expect(nextCalled).toBe(true);
  });

  it('replaces an empty-string req.owner with anonymous', async () => {
    const { resolveOwner } = await import('./resolve-owner.js');
    const next = (() => {}) as () => void;
    const req = { owner: '' } as unknown as Parameters<typeof resolveOwner>[0];
    const res = {} as unknown as Parameters<typeof resolveOwner>[1];

    resolveOwner(req, res, next);

    expect((req as unknown as { owner: string }).owner).toBe('anonymous');
  });
});
