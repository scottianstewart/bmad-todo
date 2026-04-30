import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { CreateTodoInput, Todo } from '@todo-app/shared';

import { createApp } from '../app.js';
import type { TodosRepo } from '../db/todos-repo.js';

function buildFakeRepo(overrides: Partial<TodosRepo> = {}): TodosRepo {
  return {
    list: vi.fn(),
    create: vi.fn(async (ownerId: string, input: CreateTodoInput): Promise<Todo> => ({
      id: '00000000-0000-0000-0000-000000000001',
      ownerId,
      title: input.title,
      completed: false,
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T00:00:00.000Z',
    })),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe('POST /api/todos', () => {
  it('creates a todo and returns 201 + Location header', async () => {
    const repo = buildFakeRepo();
    const app = createApp({ todosRepo: repo });

    const res = await request(app).post('/api/todos').send({ title: 'buy milk' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/api/todos/00000000-0000-0000-0000-000000000001');
    expect(res.body).toMatchObject({
      id: '00000000-0000-0000-0000-000000000001',
      ownerId: 'anonymous',
      title: 'buy milk',
      completed: false,
    });
    expect(repo.create).toHaveBeenCalledWith('anonymous', { title: 'buy milk' });
  });

  it('rejects empty title with 400 + VALIDATION_FAILED', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });

    const res = await request(app).post('/api/todos').send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects >280 char title with 400', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });
    const tooLong = 'x'.repeat(281);

    const res = await request(app).post('/api/todos').send({ title: tooLong });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects missing title field with 400', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });

    const res = await request(app).post('/api/todos').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('uses req.owner from resolveOwner middleware', async () => {
    const repo = buildFakeRepo();
    const app = createApp({ todosRepo: repo });

    await request(app).post('/api/todos').send({ title: 'task' });

    expect(repo.create).toHaveBeenCalledWith('anonymous', { title: 'task' });
  });
});
