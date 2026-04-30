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

describe('GET /api/todos', () => {
  it('returns the list of todos for req.owner', async () => {
    const fakeTodos: Todo[] = [
      {
        id: 'a',
        ownerId: 'anonymous',
        title: 'first',
        completed: false,
        createdAt: '2026-04-29T00:00:00.000Z',
        updatedAt: '2026-04-29T00:00:00.000Z',
      },
    ];
    const repo = buildFakeRepo({
      list: vi.fn(async () => fakeTodos),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTodos);
    expect(repo.list).toHaveBeenCalledWith('anonymous');
  });

  it('returns an empty array when there are no todos', async () => {
    const repo = buildFakeRepo({
      list: vi.fn(async () => []),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

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

describe('PATCH /api/todos/:id', () => {
  const validId = '00000000-0000-4000-8000-000000000001';

  it('updates a todo and returns 200 + the updated record', async () => {
    const updated: Todo = {
      id: validId,
      ownerId: 'anonymous',
      title: 'updated',
      completed: true,
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T01:00:00.000Z',
    };
    const repo = buildFakeRepo({
      update: vi.fn(async () => updated),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).patch(`/api/todos/${validId}`).send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith('anonymous', validId, { completed: true });
  });

  it('returns 404 + TODO_NOT_FOUND when repo returns null', async () => {
    const repo = buildFakeRepo({
      update: vi.fn(async () => null),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).patch(`/api/todos/${validId}`).send({ completed: true });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TODO_NOT_FOUND');
  });

  it('rejects invalid UUID with 400 + VALIDATION_FAILED', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });

    const res = await request(app).patch('/api/todos/not-a-uuid').send({ completed: true });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects invalid body with 400', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });

    const res = await request(app)
      .patch(`/api/todos/${validId}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('DELETE /api/todos/:id', () => {
  const validId = '00000000-0000-4000-8000-000000000001';

  it('returns 204 No Content on success', async () => {
    const repo = buildFakeRepo({
      delete: vi.fn(async () => {}),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).delete(`/api/todos/${validId}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(repo.delete).toHaveBeenCalledWith('anonymous', validId);
  });

  it('returns 204 even when the id does not exist (idempotent per D3.2)', async () => {
    const repo = buildFakeRepo({
      delete: vi.fn(async () => {}),
    });
    const app = createApp({ todosRepo: repo });

    const res = await request(app).delete(`/api/todos/${validId}`);

    expect(res.status).toBe(204);
  });

  it('rejects invalid UUID with 400', async () => {
    const app = createApp({ todosRepo: buildFakeRepo() });

    const res = await request(app).delete('/api/todos/not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});
