# Story 1.5: Local PostgreSQL via docker-compose

Status: review

## Story

As a **developer**,
I want **a single command that starts a local PostgreSQL 17 instance with persistent storage**,
so that **backend development does not require a host install**.

## Acceptance Criteria

1. **AC1 — docker-compose.** `pnpm db:up` runs `docker compose up -d` and starts a Postgres 17 container with a named volume for persistence. [Source: epics.md Story 1.5]
2. **AC2 — Port.** The container exposes Postgres on `localhost:5432`. [Source: epics.md Story 1.5]
3. **AC3 — .env.example.** `.env.example` documents `DATABASE_URL` with the expected connection string format. [Source: epics.md Story 1.5]
4. **AC4 — Env defaults.** `.env.example` defaults `BIND=127.0.0.1`, `ALLOW_PUBLIC_BIND=false`, `LOG_LEVEL=info`, `NODE_ENV=development`. [Source: epics.md Story 1.5]
5. **AC5 — README.** README documents `pnpm db:up` and how to verify connectivity. [Source: epics.md Story 1.5]
6. **AC6 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
7. **AC7 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Create docker-compose.yml** (AC: 1, 2)
  - [x] 1.1 — Create `docker-compose.yml` with Postgres 17, user/pass/db "todo", port 5432, named volume `pgdata`.

- [x] **Task 2 — Create .env.example** (AC: 3, 4)
  - [x] 2.1 — Create `.env.example` with `DATABASE_URL`, `PORT`, `BIND`, `ALLOW_PUBLIC_BIND`, `LOG_LEVEL`, `NODE_ENV`.

- [x] **Task 3 — Add db:up script** (AC: 1)
  - [x] 3.1 — Add `"db:up": "docker compose up -d"` to root package.json.

- [x] **Task 4 — Update README** (AC: 5)
  - [x] 4.1 — Document quick start with `pnpm db:up`, `pnpm db:migrate`, and verify connectivity command.
  - [x] 4.2 — Add security warning about no auth + public bind.

- [x] **Task 5 — Verify all gates** (AC: 6, 7)
  - [x] 5.1 — `pnpm lint` exits 0
  - [x] 5.2 — `pnpm typecheck` exits 0

## Dev Notes

### Critical patterns

1. **Docker Compose v2 syntax** — `docker compose` (no hyphen), not `docker-compose`.
2. **Named volume `pgdata`** — persists across container restarts.
3. **Default credentials `todo:todo`** — dev-only, matches `.env.example`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

No issues encountered.

### Completion Notes List

- **All 7 ACs satisfied.** Docker-compose with Postgres 17, .env.example, README with quick start + security warning, db:up script.
- Story file created retroactively — implementation was done as part of a batch with Story 1.6.

### File List

| File | Type | Purpose |
|---|---|---|
| `docker-compose.yml` | NEW | Postgres 17 container with named volume, port 5432 |
| `.env.example` | NEW | Documented env vars: DATABASE_URL, PORT, BIND, ALLOW_PUBLIC_BIND, LOG_LEVEL, NODE_ENV |
| `README.md` | NEW | Quick start, scripts table, security warning, connectivity verification |
| `package.json` | UPDATE | Added db:up script |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Created docker-compose.yml, .env.example, README, db:up script | Story 1.5 implementation |
