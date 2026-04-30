# Story 2.2: Server error envelope, validation middleware, and security middleware

Status: review

## Story

As a **developer**,
I want **the server to consistently produce error envelopes, validate every request via Zod, and apply baseline security middleware**,
so that **subsequent route stories can rely on a uniform error and validation contract**.

## Acceptance Criteria

1. **AC1 — Error-handler middleware.** `apps/server/src/middleware/error-handler.ts` exports an Express error-handling middleware (4-arity: `(err, req, res, next)`) that translates thrown errors into `{ "error": { "message", "code" } }` JSON. Status code rules: `ApiError` subclass instances use their `.status`; `ZodError` → 400 with `code: 'VALIDATION_FAILED'`; otherwise 500 with `code: 'INTERNAL'` and a generic message (the original error is logged via the request logger but not exposed to the client). [Source: architecture.md D3.3]
2. **AC2 — `ApiError` server class.** `apps/server/src/lib/errors.ts` exports a `class ApiError extends Error` with `status: number` and `code: string` (e.g., `class TodoNotFoundError extends ApiError` etc. — but no concrete subclasses required in this story; just the base class). [Source: architecture.md D3.3, §Implementation Patterns → Process Patterns → "Throw typed errors from repos/services"]
3. **AC3 — `validate` middleware factory.** `apps/server/src/middleware/validate.ts` exports `validate(schema, source = 'body')` returning Express middleware. It runs `schema.safeParse(req[source])` (where `source` ∈ `'body' | 'query' | 'params'`) and on failure throws `ZodError` (caught by the error-handler → 400 + `VALIDATION_FAILED`). On success, it replaces `req[source]` with the parsed data so route handlers see the normalized form. [Source: architecture.md D1.2 / D3.3]
4. **AC4 — Helmet applied.** `helmet()` is wired on every response (already present from Story 1.3 — verify and document; no change required unless missing). [Source: architecture.md D2.3]
5. **AC5 — CORS env-driven allowlist.** CORS allowlists `CORS_ORIGIN` (env var; defaults to `http://localhost:5173` in development). In production, falls back to same-origin. `env.ts` adds `CORS_ORIGIN` (optional string). [Source: architecture.md D2.3]
6. **AC6 — Body-size limit.** `express.json({ limit: '8kb' })` replaces the existing default-limit usage. [Source: architecture.md D2.3]
7. **AC7 — `request_duration_ms` in logs.** `pino-http` logs every request with a `responseTime` field renamed/aliased as `request_duration_ms` per NFR-1. Verify log output includes the field; add a custom `customSuccessMessage` or `customAttributeKeys` if needed. [Source: architecture.md §D5.4 + NFR-1]
8. **AC8 — Error-handler is registered LAST.** In `app.ts`, the error-handler middleware is registered AFTER all routes (Express requires this — error middleware caught by Express only when registered last). [Source: Express docs convention]
9. **AC9 — Tests for error-handler.** `apps/server/src/middleware/error-handler.test.ts` covers: (a) `ApiError` thrown from a route → response shape + status; (b) `ZodError` from `validate` → 400 + `VALIDATION_FAILED`; (c) generic `Error` → 500 + `INTERNAL` + generic message; (d) original `Error` is logged but not in response.
10. **AC10 — Tests for validate factory.** `apps/server/src/middleware/validate.test.ts` covers: (a) valid body → next called, body normalized; (b) invalid body → 400 + `VALIDATION_FAILED`; (c) source = 'query' works; (d) source = 'params' works.
11. **AC11 — Tests for security middleware.** `apps/server/src/test/security.int.test.ts` covers: helmet headers present on a sample response, CORS allowlist accepts the configured origin and rejects others, request body >8 kB rejected with 413.
12. **AC12 — Lint, typecheck, test, build all pass.**

## Tasks / Subtasks

- [x] **Task 1 — `ApiError` base class** (AC: 2)
  - [x] 1.1 — Create `apps/server/src/lib/errors.ts` with `class ApiError extends Error` (`status: number`, `code: string`).

- [x] **Task 2 — Error-handler middleware** (AC: 1, 8, 9)
  - [x] 2.1 — Create `apps/server/src/middleware/error-handler.ts` with 4-arity error middleware.
  - [x] 2.2 — Use `req.log` (pino-http) to log unhandled errors at `error` level with the original error attached.
  - [x] 2.3 — Wire it LAST in `app.ts` (after all routes).
  - [x] 2.4 — Tests in `apps/server/src/middleware/error-handler.test.ts`.

- [x] **Task 3 — `validate` middleware factory** (AC: 3, 10)
  - [x] 3.1 — Create `apps/server/src/middleware/validate.ts` exporting `validate<S extends ZodTypeAny>(schema: S, source: 'body'|'query'|'params' = 'body')`.
  - [x] 3.2 — On parse failure, throw the `ZodError` (the error-handler translates it).
  - [x] 3.3 — On success, replace `req[source]` with the parsed value (typed via TS narrowing — careful with Express's `Query` / `ParamsDictionary` types; cast at the boundary).
  - [x] 3.4 — Tests in `apps/server/src/middleware/validate.test.ts`.

- [x] **Task 4 — CORS allowlist + env wiring** (AC: 5)
  - [x] 4.1 — Add `CORS_ORIGIN` to `env.ts` (optional string, default `http://localhost:5173`).
  - [x] 4.2 — In `app.ts`, replace `cors()` with `cors({ origin: env.CORS_ORIGIN })`.
  - [x] 4.3 — Update `.env.example` to document `CORS_ORIGIN`.

- [x] **Task 5 — Body-size limit** (AC: 6)
  - [x] 5.1 — In `app.ts`, change `express.json()` to `express.json({ limit: '8kb' })`.

- [x] **Task 6 — `request_duration_ms` log field** (AC: 7)
  - [x] 6.1 — Configure `pino-http` with `customAttributeKeys: { responseTime: 'request_duration_ms' }`.

- [x] **Task 7 — Security integration tests** (AC: 11)
  - [x] 7.1 — `apps/server/src/test/security.int.test.ts` covering helmet, CORS, body-size.

- [x] **Task 8 — Self-verify all gates** (AC: 12)
  - [x] 8.1 — `pnpm lint` exits 0.
  - [x] 8.2 — `pnpm typecheck` exits 0.
  - [x] 8.3 — `pnpm test` passes.
  - [x] 8.4 — Update `docs/ai-log.md`.

## Dev Notes

### Critical patterns

1. **Error-handler runs LAST.** Express only routes errors to 4-arity middleware after all preceding handlers have been registered. `app.use(errorHandler)` must come AFTER all `app.use(router)` calls.
2. **Repos and services NEVER call `res.json()` / `res.status()`.** They throw `ApiError` (or a subclass). Routes either `await` and return data or `next(err)`. Async routes that throw bubble naturally to the error-handler in Express 5.
3. **Zod 4 imports `ZodError` from `zod`** — same as Zod 3. The shape: `err.issues` (not `err.errors` — that was Zod 1).
4. **`pino-http` logs `responseTime` by default in ms.** Use `customAttributeKeys` to rename to `request_duration_ms` per NFR-1.
5. **Express 5 native promise support.** Async route handlers can throw, and Express will call the error-handler. No `express-async-errors` shim needed.
6. **Generic 500 errors must NOT leak internal details.** Log via `req.log.error({ err })` then send a generic envelope: `{ error: { message: 'Internal server error', code: 'INTERNAL' } }`.
7. **`validate` body replacement gotcha.** Express's `req.body` is typed `any` by default; replacing it with the Zod-parsed value works at runtime but routes still see `any`. That's fine — type-narrowing via Zod-inferred types happens at the route handler when it casts via `z.infer`.

### Things NOT in this story

- No actual route handlers using `validate(...)` — those are 2.4, 2.5, 2.8, 2.9.
- No client-side error rendering — that's 2.3.
- No rate limiting (per architecture D2.3 explicit deferral).

### Source tree components touched

| File | Type |
|---|---|
| `apps/server/src/lib/errors.ts` | NEW |
| `apps/server/src/middleware/error-handler.ts` | NEW |
| `apps/server/src/middleware/error-handler.test.ts` | NEW |
| `apps/server/src/middleware/validate.ts` | NEW |
| `apps/server/src/middleware/validate.test.ts` | NEW |
| `apps/server/src/test/security.int.test.ts` | NEW |
| `apps/server/src/app.ts` | UPDATE |
| `apps/server/src/env.ts` | UPDATE |
| `.env.example` | UPDATE |
| `docs/ai-log.md` | UPDATE |

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context) — autonomous Epic 2 batch on 2026-04-29.

### Completion Notes List
- All 12 ACs satisfied. 60/60 workspace tests pass (11 client + 32 server + 17 shared); +11 server tests added (3 error-handler, 4 validate, 4 security).
- `request_duration_ms` confirmed in pino-http log output (visible in test runs).
- Two surprises during impl, both fixed cleanly:
  1. `cors({ origin: 'string' })` always returns ACAO=configured-string regardless of incoming Origin (browser does the rejection). Switched to a function-based origin check so the server itself rejects unlisted origins.
  2. `express.json({ limit })` throws `PayloadTooLargeError` (a generic Error with `type: 'entity.too.large'`), which would have fallen through to 500. Added explicit handling in the error-handler → 413 + `PAYLOAD_TOO_LARGE`.
- Lint surfaced one issue: Express `ErrorRequestHandler` requires 4-arity for error-middleware detection, but ESLint flagged the unused `next`. Used `// eslint-disable-next-line` because dropping the parameter breaks Express's error-middleware contract.

### File List
| File | Type |
|---|---|
| `apps/server/src/lib/errors.ts` | NEW |
| `apps/server/src/middleware/error-handler.ts` | NEW |
| `apps/server/src/middleware/error-handler.test.ts` | NEW |
| `apps/server/src/middleware/validate.ts` | NEW |
| `apps/server/src/middleware/validate.test.ts` | NEW |
| `apps/server/src/test/security.int.test.ts` | NEW |
| `apps/server/src/app.ts` | UPDATE |
| `apps/server/src/env.ts` | UPDATE (add CORS_ORIGIN) |
| `.env.example` | UPDATE |

### Change Log
| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Story 2.2 created + implemented (review) | Epic 2 server-side error/validation/security infrastructure |
