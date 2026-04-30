import { describe, expect, it } from 'vitest';

import {
  MAX_TITLE_LENGTH,
  createTodoInputSchema,
  todoSchema,
  updateTodoInputSchema,
} from './todo.js';

describe('todoSchema', () => {
  it('accepts a valid todo', () => {
    const result = todoSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerId: 'anonymous',
      title: 'Buy groceries',
      completed: false,
      createdAt: '2026-04-29T12:00:00.000Z',
      updatedAt: '2026-04-29T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a todo with invalid uuid', () => {
    const result = todoSchema.safeParse({
      id: 'not-a-uuid',
      ownerId: 'anonymous',
      title: 'Buy groceries',
      completed: false,
      createdAt: '2026-04-29T12:00:00.000Z',
      updatedAt: '2026-04-29T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a todo with empty title', () => {
    const result = todoSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerId: 'anonymous',
      title: '',
      completed: false,
      createdAt: '2026-04-29T12:00:00.000Z',
      updatedAt: '2026-04-29T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a todo with non-ISO createdAt', () => {
    const result = todoSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerId: 'anonymous',
      title: 'Buy groceries',
      completed: false,
      createdAt: 'not-a-date',
      updatedAt: '2026-04-29T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('createTodoInputSchema', () => {
  it('accepts a valid title', () => {
    const result = createTodoInputSchema.safeParse({ title: 'Buy groceries' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = createTodoInputSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    const result = createTodoInputSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a title exceeding MAX_TITLE_LENGTH', () => {
    const result = createTodoInputSchema.safeParse({ title: 'a'.repeat(MAX_TITLE_LENGTH + 1) });
    expect(result.success).toBe(false);
  });

  it('accepts a title at exactly MAX_TITLE_LENGTH', () => {
    const result = createTodoInputSchema.safeParse({ title: 'a'.repeat(MAX_TITLE_LENGTH) });
    expect(result.success).toBe(true);
  });
});

describe('updateTodoInputSchema', () => {
  it('accepts partial update with title only', () => {
    const result = updateTodoInputSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with completed only', () => {
    const result = updateTodoInputSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (no-op update)', () => {
    const result = updateTodoInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding MAX_TITLE_LENGTH', () => {
    const result = updateTodoInputSchema.safeParse({ title: 'a'.repeat(MAX_TITLE_LENGTH + 1) });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only title', () => {
    const result = updateTodoInputSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });
});
