import { describe, expect, it, vi } from 'vitest';

import { createTodosRepo } from './todos-repo.js';

function makeFakeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    ownerId: 'anonymous',
    title: 'Test todo',
    completed: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createMockDb() {
  const returningFn = vi.fn();
  const whereFn = vi.fn().mockReturnValue({ returning: returningFn });
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn });
  const orderByFn = vi.fn().mockResolvedValue([]);
  const fromFn = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: orderByFn }) });

  const db = {
    select: vi.fn().mockReturnValue({ from: fromFn }),
    insert: vi.fn().mockReturnValue({ values: valuesFn }),
    update: vi.fn().mockReturnValue({ set: setFn }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
    _mocks: { returningFn, whereFn, valuesFn, setFn, orderByFn, fromFn },
  };

  return db;
}

describe('createTodosRepo', () => {
  it('returns an object with list, create, update, delete methods', () => {
    const db = createMockDb();
    const repo = createTodosRepo(db as never);

    expect(repo).toHaveProperty('list');
    expect(repo).toHaveProperty('create');
    expect(repo).toHaveProperty('update');
    expect(repo).toHaveProperty('delete');
    expect(typeof repo.list).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
  });

  describe('list', () => {
    it('returns mapped todos with ISO date strings', async () => {
      const db = createMockDb();
      const row = makeFakeRow();
      db._mocks.orderByFn.mockResolvedValue([row]);

      const repo = createTodosRepo(db as never);
      const result = await repo.list('anonymous');

      expect(result).toEqual([
        {
          id: row.id,
          ownerId: 'anonymous',
          title: 'Test todo',
          completed: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('returns empty array when no todos exist', async () => {
      const db = createMockDb();
      db._mocks.orderByFn.mockResolvedValue([]);

      const repo = createTodosRepo(db as never);
      const result = await repo.list('anonymous');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('returns a mapped todo after insert', async () => {
      const db = createMockDb();
      const row = makeFakeRow({ title: 'New todo' });
      db._mocks.returningFn.mockResolvedValue([row]);

      const repo = createTodosRepo(db as never);
      const result = await repo.create('anonymous', { title: 'New todo' });

      expect(result.title).toBe('New todo');
      expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('update', () => {
    it('returns mapped todo when found', async () => {
      const db = createMockDb();
      const row = makeFakeRow({ completed: true });
      db._mocks.returningFn.mockResolvedValue([row]);

      const repo = createTodosRepo(db as never);
      const result = await repo.update('anonymous', row.id as string, { completed: true });

      expect(result).not.toBeNull();
      expect(result!.completed).toBe(true);
    });

    it('returns null when todo not found', async () => {
      const db = createMockDb();
      db._mocks.returningFn.mockResolvedValue([]);

      const repo = createTodosRepo(db as never);
      const result = await repo.update('anonymous', 'nonexistent', { completed: true });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('calls db.delete without throwing', async () => {
      const db = createMockDb();
      const repo = createTodosRepo(db as never);

      await expect(repo.delete('anonymous', 'some-id')).resolves.toBeUndefined();
    });
  });
});
