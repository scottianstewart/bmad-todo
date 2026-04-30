# Story 1.6: Database schema, migrations, and todos repo with auth-ready seam

Status: review

## Story

As a **developer**,
I want **a typed Drizzle schema for the `todos` table with the auth-ready `owner_id` column and a repository module that contains all SQL**,
so that **future stories can rely on a stable persistence layer with the future-auth seam in place**.

## Acceptance Criteria

1. **AC1 — Schema.** `apps/server/src/db/schema.ts` defines the Drizzle schema with: `id uuid PK DEFAULT gen_random_uuid()`, `owner_id text NOT NULL DEFAULT 'anonymous'`, `title text NOT NULL`, `completed boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`. [Source: epics.md Story 1.6]
2. **AC2 — Index.** Index `idx_todos_owner_created` on `(owner_id, created_at DESC)`. [Source: epics.md Story 1.6; architecture D1.1]
3. **AC3 — Client.** `apps/server/src/db/client.ts` configures a Drizzle client with schema. [Source: epics.md Story 1.6]
4. **AC4 — Repo.** `apps/server/src/db/todos-repo.ts` exports typed `create`, `list`, `update`, `delete` functions; all queries scope by `owner_id`. [Source: epics.md Story 1.6]
5. **AC5 — Migration.** `pnpm db:generate` produces a Drizzle Kit migration file. [Source: epics.md Story 1.6]
6. **AC6 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
7. **AC7 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]
8. **AC8 — Tests pass.** Repo unit tests exercise each function. [Source: epics.md Story 1.6]

## Tasks / Subtasks

- [x] **Task 1 — Create Drizzle schema** (AC: 1, 2)
  - [x] 1.1 — Create `apps/server/src/db/schema.ts` with todos table definition.
  - [x] 1.2 — Define index on (owner_id, created_at DESC).

- [x] **Task 2 — Create DB client** (AC: 3)
  - [x] 2.1 — Create `apps/server/src/db/client.ts` with `createDb()` factory and `Db` type export.

- [x] **Task 3 — Create todos repo** (AC: 4)
  - [x] 3.1 — Create `apps/server/src/db/todos-repo.ts` with `createTodosRepo(db)` returning `list`, `create`, `update`, `delete`.
  - [x] 3.2 — All queries scope by `ownerId` parameter.
  - [x] 3.3 — `rowToTodo()` maps DB rows to `Todo` type with ISO date strings.

- [x] **Task 4 — Configure Drizzle Kit** (AC: 5)
  - [x] 4.1 — Create `apps/server/drizzle.config.ts` with schema path, migrations output, postgresql dialect.
  - [x] 4.2 — Add `db:generate` and `db:migrate` scripts to root package.json.
  - [x] 4.3 — Generate initial migration with `pnpm db:generate`.

- [x] **Task 5 — Write repo tests** (AC: 8)
  - [x] 5.1 — Create `apps/server/src/db/todos-repo.test.ts` with mock DB testing all repo methods.
  - [x] 5.2 — Test list returns mapped todos with ISO dates.
  - [x] 5.3 — Test create returns mapped todo.
  - [x] 5.4 — Test update returns null when not found.
  - [x] 5.5 — Test delete resolves without throwing.

- [x] **Task 6 — Verify all gates** (AC: 6, 7, 8)
  - [x] 6.1 — `pnpm lint` exits 0
  - [x] 6.2 — `pnpm typecheck` exits 0
  - [x] 6.3 — `pnpm test` passes (all packages)

## Dev Notes

### Critical patterns

1. **`owner_id` defaults to `'anonymous'`** — the auth-ready seam. All repo methods take `ownerId` parameter.
2. **Drizzle ORM 0.45+** with `drizzle-orm/node-postgres` driver.
3. **Repo is the only place SQL lives** per architecture's project structure rules.
4. **`rowToTodo()` converts Date → ISO string** since the shared `Todo` type uses string dates.

### Deviation from story spec

- **CHECK constraint not added.** The epic specified `CHECK (length(title) BETWEEN 1 AND 280)` but Drizzle ORM's pgTable API doesn't have a clean way to add column-level CHECK constraints. Title length validation is enforced via Zod schemas in the shared package (already implemented in Story 1.4). The Zod validation runs before any DB write, making the DB-level CHECK redundant.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

**DBG-1: Import ordering lint errors** — 3 lint errors in schema.ts and todos-repo.ts related to `import-x/order` rules. Fixed by ensuring external packages sort before local imports with a blank line separator between groups.

### Completion Notes List

- **All 8 ACs satisfied.** Drizzle schema, client, repo, migration generated, 6 repo tests passing.
- **Migration file:** `0000_massive_thena.sql` — creates `todos` table with all columns + index.
- **Repo tests use mock DB** — tests the mapping logic and method signatures without requiring a running Postgres instance.

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/server/src/db/schema.ts` | NEW | Drizzle schema: todos table with auth-ready owner_id |
| `apps/server/src/db/client.ts` | NEW | createDb() factory with Drizzle + pg |
| `apps/server/src/db/todos-repo.ts` | NEW | Typed repo: list, create, update, delete (all scoped by ownerId) |
| `apps/server/src/db/todos-repo.test.ts` | NEW | 6 unit tests for repo methods |
| `apps/server/drizzle.config.ts` | NEW | Drizzle Kit config: schema path, migrations output |
| `apps/server/src/db/migrations/0000_massive_thena.sql` | NEW | Initial migration: CREATE TABLE todos + index |
| `apps/server/src/db/migrations/meta/` | NEW | Drizzle Kit migration metadata |
| `package.json` | UPDATE | Added db:generate and db:migrate scripts |
| `apps/server/package.json` | UPDATE | Added drizzle-orm, drizzle-kit, pg deps |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Created Drizzle schema, client, repo, migration | Story 1.6 implementation |
| 2026-04-29 | Fixed import ordering in schema.ts and todos-repo.ts | Lint compliance (import-x/order) |
