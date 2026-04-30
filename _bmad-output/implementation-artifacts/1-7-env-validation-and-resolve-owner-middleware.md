# Story 1.7: Env validation and resolveOwner middleware

Status: review

## Story

As a **developer**,
I want **the server to validate its environment at boot and inject `req.owner` for every authenticated request**,
so that **misconfigurations fail fast and every route operates inside the future-auth seam from day one**.

## Acceptance Criteria

1. **AC1 — Env schema.** `apps/server/src/env.ts` validates `DATABASE_URL`, `BIND`, `PORT`, `ALLOW_PUBLIC_BIND`, `LOG_LEVEL`, `NODE_ENV` via Zod. [Source: epics.md Story 1.7]
2. **AC2 — Fail fast.** Server crashes at boot with a descriptive error if any env var is invalid. [Source: epics.md Story 1.7]
3. **AC3 — resolveOwner middleware.** `apps/server/src/middleware/resolve-owner.ts` sets `req.owner = 'anonymous'` for every request. [Source: epics.md Story 1.7]
4. **AC4 — Wired in app.ts.** `resolveOwner` runs before all `/api/*` routes. [Source: epics.md Story 1.7]
5. **AC5 — Integration test.** Test asserts `req.owner === 'anonymous'` on a sample route. [Source: epics.md Story 1.7]
6. **AC6 — Env tests.** Unit tests for env validation (defaults, overrides, invalid values). [Source: inferred from NFR-8]
7. **AC7 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
8. **AC8 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Create env validation** (AC: 1, 2)
  - [x] 1.1 — Create `apps/server/src/env.ts` with Zod schema and `parseEnv()` function.
  - [x] 1.2 — All env vars have sensible defaults; PORT coerces from string to number; ALLOW_PUBLIC_BIND transforms to boolean.

- [x] **Task 2 — Create resolveOwner middleware** (AC: 3)
  - [x] 2.1 — Create `apps/server/src/middleware/resolve-owner.ts`.
  - [x] 2.2 — Augment Express Request type with `owner: string`.

- [x] **Task 3 — Wire into app and bootstrap** (AC: 4)
  - [x] 3.1 — Add `resolveOwner` to `app.ts` before API routes.
  - [x] 3.2 — Update `index.ts` to use `parseEnv()` for PORT and BIND.

- [x] **Task 4 — Write tests** (AC: 5, 6)
  - [x] 4.1 — `env.test.ts`: 6 tests covering defaults, valid overrides, invalid LOG_LEVEL, invalid NODE_ENV, PORT coercion, non-numeric PORT.
  - [x] 4.2 — `resolve-owner.test.ts`: integration test via supertest asserting `req.owner === 'anonymous'`.

- [x] **Task 5 — Verify all gates** (AC: 7, 8)
  - [x] 5.1 — `pnpm lint` exits 0
  - [x] 5.2 — `pnpm typecheck` exits 0
  - [x] 5.3 — `pnpm test` passes (all packages)

## Dev Notes

### Critical patterns

1. **`parseEnv()` accepts optional `source` parameter** — defaults to `process.env` but allows test injection.
2. **Express Request augmentation via `declare module 'express'`** — adds `owner: string` to Request interface.
3. **Zod 4 `z.coerce.number()`** for PORT — handles the string-to-number conversion that `process.env` delivers.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

No issues encountered.

### Completion Notes List

- **All 8 ACs satisfied.** Env validation with Zod, resolveOwner middleware, wired into app.ts and index.ts, 7 tests passing.
- **Zod dependency added to server package** for env validation (separate from @todo-app/shared's Zod dep).

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/server/src/env.ts` | NEW | Zod env schema: DATABASE_URL, PORT, BIND, ALLOW_PUBLIC_BIND, LOG_LEVEL, NODE_ENV |
| `apps/server/src/env.test.ts` | NEW | 6 unit tests for env validation |
| `apps/server/src/middleware/resolve-owner.ts` | NEW | Sets req.owner = 'anonymous' for all /api routes |
| `apps/server/src/middleware/resolve-owner.test.ts` | NEW | Integration test: req.owner is set on API routes |
| `apps/server/src/app.ts` | UPDATE | Wired resolveOwner middleware before API routes |
| `apps/server/src/index.ts` | UPDATE | Uses parseEnv() for PORT and BIND |
| `apps/server/package.json` | UPDATE | Added zod dependency |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Created env.ts, resolve-owner.ts, wired into app/bootstrap | Story 1.7 implementation |
