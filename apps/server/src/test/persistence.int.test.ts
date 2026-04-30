import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { createDb } from '../db/client.js';
import { todos } from '../db/schema.js';
import { createTodosRepo } from '../db/todos-repo.js';

const TEST_DB_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://todo:todo@localhost:5433/todo';

async function isDbReachable(url: string): Promise<boolean> {
  try {
    const probe = createDb(url);
    // Drizzle exposes the underlying pg pool as `$client`.
    const client = probe.$client;
    const c = await client.connect();
    c.release();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

describe('persistence integration (FR-6 + NFR-3)', async () => {
  const reachable = await isDbReachable(TEST_DB_URL);

  beforeAll(async () => {
    if (!reachable) return;
    const db = createDb(TEST_DB_URL);
    await db.delete(todos);
    await db.$client.end();
  });

  afterAll(async () => {
    if (!reachable) return;
    const db = createDb(TEST_DB_URL);
    await db.delete(todos);
    await db.$client.end();
  });

  it.skipIf(!reachable)(
    'survives 1000 sequential POSTs and a simulated restart',
    async () => {
      // Phase 1: app instance #1 inserts 500 todos.
      const db1 = createDb(TEST_DB_URL);
      const repo1 = createTodosRepo(db1);
      const app1 = createApp({ todosRepo: repo1 });

      for (let i = 0; i < 500; i++) {
        const res = await request(app1).post('/api/todos').send({ title: `task ${i}` });
        expect(res.status).toBe(201);
      }

      // Tear down the first app's pool — simulates a process restart.
      await db1.$client.end();

      // Phase 2: app instance #2 (fresh pool) inserts 500 more.
      const db2 = createDb(TEST_DB_URL);
      const repo2 = createTodosRepo(db2);
      const app2 = createApp({ todosRepo: repo2 });

      for (let i = 500; i < 1000; i++) {
        const res = await request(app2).post('/api/todos').send({ title: `task ${i}` });
        expect(res.status).toBe(201);
      }

      // Phase 3: GET via app #2 — should see all 1000 records (500 from app
      // #1 that survived the restart + 500 from app #2).
      const list2 = await request(app2).get('/api/todos');
      expect(list2.status).toBe(200);
      expect(list2.body).toHaveLength(1000);

      await db2.$client.end();

      // Phase 4: ANOTHER restart. Spin up app #3 with no other writes.
      const db3 = createDb(TEST_DB_URL);
      const repo3 = createTodosRepo(db3);
      const app3 = createApp({ todosRepo: repo3 });

      const list3 = await request(app3).get('/api/todos');
      expect(list3.status).toBe(200);
      expect(list3.body).toHaveLength(1000);

      // Confirm cold restart returned an identical list (same titles).
      const titles = (list3.body as { title: string }[]).map((t) => t.title).sort();
      const expected = Array.from({ length: 1000 }, (_, i) => `task ${i}`).sort();
      expect(titles).toEqual(expected);

      await db3.$client.end();
    },
    60_000, // 1000 inserts + 2 restarts; 60s ceiling is generous.
  );
});
