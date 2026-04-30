# Story 3.3: Cross-browser Playwright matrix (NFR-4)

Status: review

## Story

As a **user on Firefox / Safari / Edge**,
I want **the app to function identically to Chrome**,
so that **my browser choice does not break my workflow**.

## Acceptance Criteria

1. **AC1 — `playwright.config.ts`** at `apps/client/playwright.config.ts` with three projects: `chromium`, `firefox`, `webkit`. Maps to Chrome, Firefox, Safari (Safari uses WebKit; Edge uses Chromium so it's covered by the chromium project per architecture).
2. **AC2 — `webServer` boots the API + client dev** automatically (Playwright handles startup/shutdown). Postgres is a precondition documented in README; CI starts it in a separate step.
3. **AC3 — `core-flow.spec.ts`** at `apps/client/src/test/e2e/core-flow.spec.ts` covers the full happy path: load app → create todo → toggle → delete → refresh → see persisted state. Each project runs the spec independently.
4. **AC4 — DB seed/cleanup fixture.** A `beforeEach` hook clears all todos for the anonymous owner via the API (DELETE each existing) so each test starts deterministic. `afterEach` cleans up too.
5. **AC5 — `playwright.yml` GitHub workflow.** Triggers on PRs and pushes to `main` plus a nightly schedule. Sets up Node 24, runs `pnpm install --frozen-lockfile`, runs `docker compose up -d` for Postgres, runs migrations, then `pnpm --filter client exec playwright test`. Uploads HTML report on failure.
6. **AC6 — Spec passes on all three browsers locally.** `pnpm --filter client exec playwright test` exits 0 with all three projects green.
7. **AC7 — Lint, typecheck, build still pass** with no regression. (Existing 117 unit/integration tests untouched.)
8. **AC8 — Visual-pass script deleted.** `apps/client/scripts/visual-pass.mjs` is replaced by the proper Playwright spec; the standalone script's job is now done by the matrix.

## Tasks / Subtasks

- [x] **Task 1 — Install Firefox + WebKit browsers** (AC: 1)
  - [x] 1.1 — `pnpm --filter client exec playwright install firefox webkit` (chromium already installed during the visual pass).

- [x] **Task 2 — Playwright config** (AC: 1, 2)
  - [x] 2.1 — Create `apps/client/playwright.config.ts` with `projects: [chromium, firefox, webkit]`, `testDir: './src/test/e2e'`, `webServer` array launching the API server (port 3001) and Vite dev (port 5173). Use `reuseExistingServer: !process.env.CI` so local re-runs don't double-boot.
  - [x] 2.2 — Configure `use.baseURL: 'http://localhost:5173'` so specs use relative paths.
  - [x] 2.3 — Set `reporter: process.env.CI ? 'github' : 'list'`. HTML reporter on failure.

- [x] **Task 3 — Core-flow spec** (AC: 3, 4)
  - [x] 3.1 — Create `apps/client/src/test/e2e/core-flow.spec.ts`.
  - [x] 3.2 — Use `test.beforeEach` to call `DELETE` on every existing todo via `request.fetch('/api/todos')` + iterate.
  - [x] 3.3 — Tests:
    - "user creates, toggles, and deletes a todo"
    - "todos persist across page refresh" — create two, refresh, assert both visible with correct completion state
    - "empty state appears when all todos are deleted"
  - [x] 3.4 — Each test uses the same baseURL and runs against the project under test.

- [x] **Task 4 — GitHub Actions workflow** (AC: 5)
  - [x] 4.1 — Create `.github/workflows/playwright.yml`. Triggers: `pull_request`, `push` to `main`, `schedule: '0 6 * * *'` (06:00 UTC nightly).
  - [x] 4.2 — Steps: checkout, setup pnpm, setup Node from `.nvmrc`, `pnpm install --frozen-lockfile`, `docker compose up -d`, wait for Postgres, apply migration via direct psql (drizzle-kit silent-fail workaround documented in deferred-work), `pnpm --filter client exec playwright install --with-deps`, `pnpm --filter client exec playwright test`.
  - [x] 4.3 — `actions/upload-artifact` for `apps/client/playwright-report/` on failure.

- [x] **Task 5 — Cleanup** (AC: 8)
  - [x] 5.1 — Delete `apps/client/scripts/visual-pass.mjs` and remove `apps/*/scripts/**` from `eslint.config.js` global ignores (the directory no longer exists; ignore is harmless but unnecessary).

- [x] **Task 6 — Self-verify** (AC: 6, 7)
  - [x] 6.1 — `pnpm --filter client exec playwright test` exits 0 across all 3 projects.
  - [x] 6.2 — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm --filter client build` all clean.
  - [x] 6.3 — Update `docs/ai-log.md`.

## Dev Notes

### Critical patterns

1. **Playwright `webServer` is a process-lifecycle helper**, not a process manager. It runs the command, waits for the URL, and kills it when tests finish. Don't `pkill` from a test — let Playwright handle it.
2. **Postgres is OUT of `webServer` scope** because docker-compose has its own lifecycle. Pre-step in CI; precondition for local dev.
3. **DB cleanup via API, not direct DB access.** The spec uses the public API (`DELETE /api/todos/:id`) to clean up between tests rather than connecting to Postgres directly. Simpler, exercises the same path users do, no DB credentials in the test.
4. **Same-origin via Vite proxy.** Story 2.1 wired `/api → http://localhost:3001` proxy in `vite.config.ts`. The spec uses relative paths (`/api/todos`), and the browser routes through the proxy. No CORS issues, no env-driven base URLs.
5. **Test isolation via fresh DB per test.** `beforeEach` deletes all todos for the anonymous owner. Tests within the same project run sequentially; Playwright doesn't parallelize within a project by default. Cross-project parallelism is fine — they hit the same DB, but `beforeEach` cleanup makes them resilient.
6. **CI nightly + PR cadence.** Architecture says "nightly + release-cut branches"; using `schedule` + `pull_request` + `push: main` covers it. Release-cut branches in this project don't exist yet — `pull_request` covers any future ones.

### Things NOT in this story

- **No axe-core integration.** That's Story 3.2.
- **No keyboard-only interaction tests.** Story 3.1.
- **No persistence-stress test (1000 cycles + restart).** Story 3.4.
- **No chaos / 500-injection.** Story 3.5.
- **No Lighthouse perf gate.** Story 3.6.
- **No screenshot regression suite.** Out of scope.

### Source tree components touched

| File | Type |
|---|---|
| `apps/client/playwright.config.ts` | NEW |
| `apps/client/src/test/e2e/core-flow.spec.ts` | NEW |
| `.github/workflows/playwright.yml` | NEW |
| `apps/client/scripts/visual-pass.mjs` | DELETE |
| `eslint.config.js` | UPDATE (drop `apps/*/scripts/**` ignore) |
| `apps/client/package.json` | UPDATE (test:e2e script) |
| `docs/ai-log.md` | UPDATE |

## Dev Agent Record

### Agent Model Used
_To be filled._

### Completion Notes List
_To be filled._

### File List
_To be filled._

### Change Log
| Date | Change |
|---|---|
| 2026-04-30 | Story 3.3 created |
