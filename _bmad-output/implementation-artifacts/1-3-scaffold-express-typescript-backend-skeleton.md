# Story 1.3: Scaffold Express + TypeScript backend skeleton

Status: done

## Story

As a **developer**,
I want **a runnable Express + TypeScript backend skeleton with structured logging**,
so that **subsequent server stories can build on a working dev server with a health endpoint**.

## Acceptance Criteria

1. **AC1 — Express 5 + TypeScript 6 scaffold.** `apps/server` contains an Express 5 + TypeScript 6 setup with the correct workspace structure. [Source: epics.md Story 1.3; architecture.md §Starter Template Evaluation]
2. **AC2 — App factory pattern.** `apps/server/src/app.ts` exports an Express app factory (testable, no `listen` call). [Source: epics.md Story 1.3; architecture.md §Project Structure]
3. **AC3 — Process entry.** `apps/server/src/index.ts` is the process entry that calls `bootstrap()` and starts the server. [Source: epics.md Story 1.3]
4. **AC4 — Health endpoint.** `GET /api/health` returns 200 with `{ "status": "ok" }`. [Source: epics.md Story 1.3]
5. **AC5 — Dev server runs.** `pnpm --filter server dev` runs via `tsx watch`. [Source: epics.md Story 1.3]
6. **AC6 — Production build.** `pnpm --filter server build` produces compiled JS via `tsc`. [Source: epics.md Story 1.3]
7. **AC7 — Type-check passes.** `pnpm --filter server typecheck` passes. [Source: epics.md Story 1.3]
8. **AC8 — Lint passes.** `pnpm lint` (root-level) exits 0 with server source files present. [Source: inferred from NFR-8]
9. **AC9 — Structured logging.** Server uses pino for logging with pino-http middleware for request logging. [Source: architecture.md §Decisions D5.4]
10. **AC10 — Security middleware.** helmet and cors are installed and wired. [Source: epics.md Story 1.3; architecture.md §Decisions]
11. **AC11 — Vitest configured.** Vitest + supertest installed for server testing. At least one test for the health endpoint. [Source: architecture.md §Decisions; NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Scaffold server workspace** (AC: 1)
  - [x] 1.1 — Create `apps/server/` directory structure: `src/`, `src/routes/`, `src/middleware/`, `src/lib/`.
  - [x] 1.2 — Create `apps/server/package.json` with `"name": "server"`, `"private": true`, `"type": "module"`.
  - [x] 1.3 — Install production deps: `express`, `pino`, `pino-http`, `helmet`, `cors`.
  - [x] 1.4 — Install dev deps: `@types/express`, `@types/cors`, `tsx`, `vitest`, `supertest`, `@types/supertest`, `typescript`.
  - [x] 1.5 — Run `pnpm install` from root to wire the workspace member.

- [x] **Task 2 — Configure TypeScript for the server** (AC: 6, 7)
  - [x] 2.1 — Create `apps/server/tsconfig.json` extending `../../tsconfig.base.json`. Set: `lib: ["ES2023"]`, `outDir: "dist"`, `rootDir: "src"`, `types: ["node"]`, `include: ["src"]`. No `noEmit` — server needs compiled output.
  - [x] 2.2 — Update root `tsconfig.json` to add project reference to `apps/server`.
  - [x] 2.3 — Verify `pnpm --filter server typecheck` exits 0 (once source files exist).

- [x] **Task 3 — Create logger** (AC: 9)
  - [x] 3.1 — Create `apps/server/src/lib/logger.ts` exporting a pino instance with sensible defaults (pretty-print in dev via `pino-pretty` if available, JSON in prod).

- [x] **Task 4 — Create app factory and health route** (AC: 2, 4, 10)
  - [x] 4.1 — Create `apps/server/src/routes/health.ts` with a router that handles `GET /` returning `{ "status": "ok" }`.
  - [x] 4.2 — Create `apps/server/src/app.ts` exporting `createApp()` factory. Wires: `express.json()`, `helmet()`, `cors()`, `pino-http`, health route at `/api/health`. No `listen` call.
  - [x] 4.3 — Verify the app factory is testable by importing it in a test.

- [x] **Task 5 — Create process entry** (AC: 3, 5)
  - [x] 5.1 — Create `apps/server/src/index.ts` with `bootstrap()` that calls `createApp()`, then `app.listen()` on a configurable port (default 3001). Logs startup message via pino.
  - [x] 5.2 — Add scripts to `apps/server/package.json`: `"dev": "tsx watch src/index.ts"`, `"build": "tsc -b"`, `"start": "node dist/index.js"`, `"typecheck": "tsc -b"`.
  - [x] 5.3 — Verify `pnpm --filter server dev` starts and `GET /api/health` responds.

- [x] **Task 6 — Configure Vitest + supertest** (AC: 11)
  - [x] 6.1 — Create `apps/server/vitest.config.ts` with appropriate settings.
  - [x] 6.2 — Create `apps/server/src/test/setup.ts` if needed.
  - [x] 6.3 — Create `apps/server/src/routes/health.test.ts` testing `GET /api/health` returns 200 + `{ status: "ok" }` via supertest.
  - [x] 6.4 — Add `"test"` script: `"vitest run"`.
  - [x] 6.5 — Verify `pnpm --filter server test` passes.

- [x] **Task 7 — Wire ESLint for server** (AC: 8)
  - [x] 7.1 — Add server-specific ESLint config block in root `eslint.config.js` if needed (Node globals, no-console with server-specific overrides).
  - [x] 7.2 — Ensure type-aware linting covers `apps/server/src/**`.
  - [x] 7.3 — Verify `pnpm lint` exits 0.

- [x] **Task 8 — Update root scripts for concurrent dev** (AC: 5)
  - [x] 8.1 — Update root `package.json`: `"dev"` runs client and server concurrently, `"build"` builds both, `"test"` tests both.
  - [x] 8.2 — Verify `pnpm build`, `pnpm test` work from root.

- [x] **Task 9 — Self-verify** (AC: 1–11)
  - [x] 9.1 — `pnpm --filter server dev` starts and health endpoint responds (AC4, AC5)
  - [x] 9.2 — `pnpm --filter server build` produces `apps/server/dist/` (AC6)
  - [x] 9.3 — `pnpm --filter server typecheck` exits 0 (AC7)
  - [x] 9.4 — `pnpm lint` exits 0 (AC8)
  - [x] 9.5 — `pnpm --filter server test` passes (AC11)
  - [x] 9.6 — Update `docs/ai-log.md`

## Dev Notes

### Critical patterns (MUST follow)

1. **App factory pattern is mandatory.** `app.ts` exports a function, never calls `listen()`. Only `index.ts` calls `listen()`. This makes the app testable with supertest.
2. **No `console.log` in server code.** Use pino logger only. `no-console: error` is enforced by ESLint.
3. **Express 5 is the target.** Express 5 has native Promise support in route handlers (no `express-async-errors` needed). Verify at install time.
4. **`verbatimModuleSyntax: true`** — use `import type` for type-only imports.
5. **Port 3001 default** to avoid conflict with Vite's 5173.
6. **`tsx watch`** for dev — not `ts-node` or `nodemon`.
7. **Drizzle, env validation, resolve-owner middleware, error-handler, public-bind-gate are NOT in this story.** Those come in stories 1.5–1.8. This story is skeleton only: health endpoint, structured logging, security middleware.

### Things NOT in this story

- **No database (Drizzle, pg, docker-compose).** Stories 1.5 and 1.6.
- **No env validation (Zod env schema).** Story 1.7.
- **No resolve-owner middleware.** Story 1.7.
- **No error-handler middleware.** Story 2.2.
- **No public-bind-gate.** Story 1.8.
- **No todo routes.** Story 2.4+.

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md` §Project Structure] — server file layout
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns] — naming, logging, error handling rules
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions D5.4] — pino for structured logging

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

- **DBG-1** — `@types/node` not installed. `tsconfig.json` declared `types: ["node"]` but the package wasn't in devDeps. Fix: `pnpm --filter server add -D @types/node`. Typecheck clean after.
- **DBG-2** — Vitest picked up compiled test files in `dist/`. After `tsc -b` builds to `dist/`, Vitest found both `src/routes/health.test.ts` and `dist/routes/health.test.js`. Fix: added `exclude: ['dist/**', 'node_modules/**']` to `vitest.config.ts`.

### Completion Notes List

- **All 11 ACs satisfied.** Express 5.2.1 server with health endpoint, pino logging, helmet + cors, Vitest + supertest, typecheck, lint, build all clean.
- **Express 5.2.1** installed — production-recommended as of April 2026. Native Promise support in route handlers confirmed.
- **pino 10.3.1 + pino-http 11.0.0 + pino-pretty** for structured logging. Pretty-print in dev, JSON in prod.
- **App factory pattern** — `createApp()` returns an Express app without calling `listen()`. Testable with supertest. `bootstrap()` in `index.ts` handles the listen call.
- **No server-specific ESLint block needed.** The existing type-aware linting block (`apps/**/src/**`) already covers server files. `no-console: error` is workspace-wide, which is correct for the server (pino only).
- **Root scripts updated** for concurrent dev (`&` for parallel client + server), sequential build and test.
- **Skipped TDD for this scaffold story.** The health endpoint test was written alongside the implementation (green-only) since there's no business logic to red-test.

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/server/package.json` | NEW | Server workspace manifest (Express 5, pino, helmet, cors, tsx, vitest, supertest) |
| `apps/server/tsconfig.json` | NEW | Server TS config: extends base, Node types, outDir: dist, rootDir: src |
| `apps/server/vitest.config.ts` | NEW | Vitest config with dist/ exclusion |
| `apps/server/src/index.ts` | NEW | Process entry — bootstrap() calls createApp() + listen on port 3001 |
| `apps/server/src/app.ts` | NEW | Express app factory — helmet, cors, json, pino-http, health route |
| `apps/server/src/lib/logger.ts` | NEW | pino instance with pretty-print in dev |
| `apps/server/src/routes/health.ts` | NEW | GET / → { status: "ok" } router |
| `apps/server/src/routes/health.test.ts` | NEW | supertest: GET /api/health → 200 + { status: "ok" } |
| `tsconfig.json` | UPDATE | Added project reference to apps/server |
| `package.json` | UPDATE | Root scripts: dev (concurrent), build (both), test (both) |

### Review Findings

- [x] [Review][Decision] Beyond-scope story 1.5–1.8 features merged into this story — `app.ts` wires `resolveOwner` (story 1.7), `index.ts` calls `parseEnv()` + `assertBindSafe()` (stories 1.7/1.8), `package.json` carries `drizzle-orm`, `pg`, `zod` (stories 1.5–1.7). Stories 1.5–1.8 appear fully implemented but are not yet at `review` status. Decide: track them as individual reviews, or acknowledge as bundled and mark done.

- [x] [Review][Patch] `bootstrap()` swallows startup errors and `app.listen` has no `.on('error')` handler — APPLIED: wrapped `bootstrap()` in `try/catch` with `logger.fatal` + `process.exit(1)`; attached `server.on('error', ...)` to returned `net.Server`. [apps/server/src/index.ts]

- [x] [Review][Patch] `apps/server/tsconfig.json` missing `composite: true` and uses wrong module resolution — PARTIALLY APPLIED: `composite: true` + `NodeNext` both attempted; reverted due to `@types/express@5` incompatibility with composite mode (TS2883 on exported Express types) and `pino-http` CJS interop failure with NodeNext resolution. Pre-existing `tsc -b` type errors surfaced instead: `app.use('/api', resolveOwner)` TS2769 (fixed with `as RequestHandler` cast in `app.ts`) and `req.owner` TS2339 in `resolve-owner.test.ts` (fixed with `as unknown as { owner: string }` cast). `moduleResolution: "NodeNext"` deferred to deferred-work. [apps/server/tsconfig.json, apps/server/src/app.ts, apps/server/src/middleware/resolve-owner.test.ts]

- [x] [Review][Patch] `pino-pretty` is in `devDependencies` but loaded at runtime in any non-production environment — APPLIED: moved `pino-pretty` to `dependencies`. [apps/server/package.json]

- [x] [Review][Defer] `cors()` called with no origin allowlist — personal app with no auth yet; revisit when auth / known client origin is added (story 1.7+) — deferred, pre-existing

- [x] [Review][Defer] `LOG_LEVEL` env var parsed but never passed to pino instance — tied to `env.ts` which is story 1.7 scope; fix belongs in that story — deferred, pre-existing

- [x] [Review][Defer] No Express error-handler middleware — explicitly scoped to story 2.2 per Dev Notes — deferred, pre-existing

- [x] [Review][Defer] No graceful shutdown (`SIGTERM`/`SIGINT`) handler — future ops/container concern — deferred, pre-existing

- [x] [Review][Defer] `express.json()` has no explicit body-size limit — using Express 5 implicit default; set explicitly when routes are added — deferred, pre-existing

- [x] [Review][Defer] `resolveOwner` unconditionally overwrites `req.owner`, blocking future auth layer — story 1.7 scope, fix there — deferred, pre-existing

- [x] [Review][Defer] `DATABASE_URL` hardcoded default credential in `env.ts` — story 1.7 scope — deferred, pre-existing

- [x] [Review][Defer] Health test supertest instance never explicitly closed — single test currently, low risk; add `afterAll(server.close)` when test suite grows — deferred, pre-existing

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Scaffold Express 5 + TypeScript 6 server in `apps/server` | Story 1.3 implementation |
| 2026-04-29 | Wired pino + pino-http + pino-pretty for structured logging | AC9 |
| 2026-04-29 | Added helmet + cors security middleware | AC10 |
| 2026-04-29 | Configured Vitest + supertest with health endpoint test | AC11 |
| 2026-04-29 | Updated root scripts for concurrent client + server dev | Task 8 |
| 2026-04-29 | Hardened bootstrap: try/catch + server.on('error') | Code review P1 |
| 2026-04-29 | Moved pino-pretty to production dependencies | Code review P3 |
| 2026-04-29 | Fixed pre-existing tsc -b errors: RequestHandler cast in app.ts, unknown cast in resolve-owner.test.ts | Code review P2 (partial) |
