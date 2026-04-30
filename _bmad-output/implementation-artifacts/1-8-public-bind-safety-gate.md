# Story 1.8: Public-bind safety gate

Status: review

## Story

As a **developer / operator**,
I want **the server to refuse to start on a public network interface unless I explicitly allow it**,
so that **the no-auth shared dataset is never exposed by accident**.

## Acceptance Criteria

1. **AC1 — Loopback allowed.** Server starts normally with `BIND=127.0.0.1` regardless of `ALLOW_PUBLIC_BIND`. [Source: epics.md Story 1.8]
2. **AC2 — Public allowed with flag.** Server starts normally with `BIND=0.0.0.0 ALLOW_PUBLIC_BIND=true`. [Source: epics.md Story 1.8]
3. **AC3 — Public blocked without flag.** Server exits with a descriptive error if BIND is non-loopback and `ALLOW_PUBLIC_BIND` is not `true`. [Source: epics.md Story 1.8]
4. **AC4 — Tests.** Unit tests cover all three cases (loopback, public+allowed, public+blocked). [Source: epics.md Story 1.8]
5. **AC5 — README warning.** README has a prominent warning section explaining R-2 and the gate's purpose. [Source: epics.md Story 1.8]
6. **AC6 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
7. **AC7 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Create public-bind-gate** (AC: 1, 2, 3)
  - [x] 1.1 — Create `apps/server/src/middleware/public-bind-gate.ts` with `assertBindSafe()`.
  - [x] 1.2 — Recognize loopback addresses: `127.0.0.1`, `::1`, `localhost`.
  - [x] 1.3 — Allow any address when `ALLOW_PUBLIC_BIND` is true.
  - [x] 1.4 — Throw descriptive error otherwise.

- [x] **Task 2 — Wire into bootstrap** (AC: 1, 2, 3)
  - [x] 2.1 — Call `assertBindSafe(env)` in `index.ts` before `app.listen()`.

- [x] **Task 3 — Write tests** (AC: 4)
  - [x] 3.1 — Test: 127.0.0.1 allowed regardless of ALLOW_PUBLIC_BIND.
  - [x] 3.2 — Test: ::1 (IPv6 loopback) allowed.
  - [x] 3.3 — Test: localhost allowed.
  - [x] 3.4 — Test: 0.0.0.0 allowed when ALLOW_PUBLIC_BIND=true.
  - [x] 3.5 — Test: 0.0.0.0 throws when ALLOW_PUBLIC_BIND=false.
  - [x] 3.6 — Test: non-loopback IP throws when ALLOW_PUBLIC_BIND=false.

- [x] **Task 4 — Verify README warning** (AC: 5)
  - [x] 4.1 — Confirm README contains security warning section (already present from Story 1.5).

- [x] **Task 5 — Verify all gates** (AC: 6, 7)
  - [x] 5.1 — `pnpm lint` exits 0
  - [x] 5.2 — `pnpm typecheck` exits 0
  - [x] 5.3 — `pnpm test` passes (all packages)

## Dev Notes

### Critical patterns

1. **`assertBindSafe()` is a startup check**, not middleware — runs in `bootstrap()` before `listen()`.
2. **Loopback set includes `localhost`** in addition to IP addresses.
3. **Uses `Pick<Env, 'BIND' | 'ALLOW_PUBLIC_BIND'>` for testability** — doesn't require full env object.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

No issues encountered.

### Completion Notes List

- **All 7 ACs satisfied.** Public-bind gate with 6 unit tests, wired into bootstrap, README warning already present.
- **README security warning was already written** during Story 1.5 — it covers R-2 and the ALLOW_PUBLIC_BIND gate.

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/server/src/middleware/public-bind-gate.ts` | NEW | assertBindSafe() — refuses non-loopback bind without ALLOW_PUBLIC_BIND |
| `apps/server/src/middleware/public-bind-gate.test.ts` | NEW | 6 unit tests covering loopback, public+allowed, public+blocked |
| `apps/server/src/index.ts` | UPDATE | Calls assertBindSafe(env) before listen() |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Created public-bind-gate.ts, wired into bootstrap | Story 1.8 implementation |
