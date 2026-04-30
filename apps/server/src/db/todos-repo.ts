import { and, desc, eq } from 'drizzle-orm';

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@todo-app/shared';

import type { Db } from './client.js';
import { todos } from './schema.js';

function rowToTodo(row: typeof todos.$inferSelect): Todo {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createTodosRepo(db: Db) {
  return {
    async list(ownerId: string): Promise<Todo[]> {
      const rows = await db
        .select()
        .from(todos)
        .where(eq(todos.ownerId, ownerId))
        .orderBy(desc(todos.createdAt));
      return rows.map(rowToTodo);
    },

    async create(ownerId: string, input: CreateTodoInput): Promise<Todo> {
      const [row] = await db
        .insert(todos)
        .values({ ownerId, title: input.title })
        .returning();
      return rowToTodo(row!);
    },

    async update(ownerId: string, id: string, input: UpdateTodoInput): Promise<Todo | null> {
      const [row] = await db
        .update(todos)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)))
        .returning();
      return row ? rowToTodo(row) : null;
    },

    async delete(ownerId: string, id: string): Promise<void> {
      await db.delete(todos).where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)));
    },
  };
}
