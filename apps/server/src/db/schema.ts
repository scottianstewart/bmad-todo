import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const todos = pgTable(
  'todos',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    ownerId: text('owner_id').notNull().default('anonymous'),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_todos_owner_created').on(table.ownerId, table.createdAt.desc()),
    // Defense in depth: Zod validates 1..280 at the API edge, but a future
    // bulk-import path or direct DB writer should still fail loud rather
    // than persist an unbounded title (per architecture D1.1).
    check('todos_title_length', sql`char_length(${table.title}) BETWEEN 1 AND 280`),
  ],
);
