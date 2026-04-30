---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-04-29'
inputDocuments:
  - '/Users/scottstewart/Desktop/todo-app/_bmad/prd.md'
  - '/Users/scottstewart/Desktop/todo-app/_bmad-output/planning-artifacts/architecture.md'
workflowType: 'epics-and-stories'
project_name: 'todo-app'
author: 'John (BMad PM)'
date: '2026-04-29'
---

# todo-app — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Todo App, decomposing the requirements from the PRD and Architecture into implementable stories. No UX design document exists yet (intentionally deferred per stakeholder); UX-shaped work items are derived from the FRs and Architecture's component breakdown.

## Requirements Inventory

### Functional Requirements

- **FR-1** — User can create a new todo by entering text and submitting. AC: blank/whitespace rejected; up to 280 chars; appears in list within 150ms median; created-at recorded server-side.
- **FR-2** — User sees all existing todos on app load, ordered by created-at descending. AC: list renders within 500ms p95 with ≤50 todos; both active and completed visible.
- **FR-3** — User can toggle a task's completion via single click/tap. AC: state change reflected within 150ms median; persisted; idempotent.
- **FR-4** — User can delete a todo via explicit delete control. AC: removed within 150ms median; persists across refresh; idempotent on missing ID.
- **FR-5** — Completed todos are visually distinguished from active. AC: not color-only (strikethrough + opacity); contrast ≥3:1.
- **FR-6** — Todo list survives page refresh, browser close/reopen, and backend restart. AC: 1000-cycle add/refresh test, zero loss; cold restart returns identical list.
- **FR-7** — Empty state UI when no todos exist. AC: visible at count=0; no error styling; affordance to create.
- **FR-8** — Loading indicator while initial fetch is in flight. AC: visible if fetch >200ms; replaced by list/empty on completion.
- **FR-9** — Inline, dismissible error UI on backend operation failure; preserves user input. AC: failed create doesn't clear input; specific error string; persists until dismissed or next success.
- **FR-10** — Optimistic UI for create/toggle/delete; reconcile with server. AC: UI within 50ms of user action; rollback on server failure (FR-9 fires).
- **FR-11** — Responsive layout from 320px to 1920px width. AC: no horizontal scroll; controls operable; ≥16px input font.
- **FR-12** — Keyboard operability for all actions (create/toggle/delete). AC: logical tab order; Enter submits; visible focus indicators.

### NonFunctional Requirements

- **NFR-1** — API responds with p95 <200ms, p99 <500ms under ≤5 RPS single-user load. Measured via server-side request-timing instrumentation.
- **NFR-2** — UI confirmation within 150ms median, 300ms p95, on localhost/LAN. Measured via client-side `performance.mark()`.
- **NFR-3** — 100% of confirmed writes (HTTP 2xx) survive backend restart. Validated via integration test (write N → restart → assert N).
- **NFR-4** — Function on latest 2 major versions of Chrome, Firefox, Safari, Edge. Validated via Playwright cross-browser runner.
- **NFR-5** — WCAG 2.1 Level AA for the 4 core flows (create/list/toggle/delete). Validated via axe-core CI + manual VoiceOver/NVDA pass.
- **NFR-6** — LCP <2.0s on Fast 3G simulated throttling with ≤50 todos. Lighthouse CI on every PR.
- **NFR-7** — Backend operation failures surface user-visible error within 1s (incl. timeouts). Chaos test injects 500/timeout responses.
- **NFR-8** — Lint + type-check + ≥80% line coverage on backend route handlers and frontend state-management logic. CI gates per PR.
- **NFR-9** — Clean clone → running app via documented bootstrap commands in <10 minutes. Quarterly walkthrough on a fresh environment.

### Additional Requirements

Pulled from `architecture.md`. These are technical/infrastructure obligations that drive specific stories.

#### Decision 1 — Auth-ready persistence seam

- Schema includes `owner_id text NOT NULL DEFAULT 'anonymous'` from day one (D1.1)
- All read/write SQL scopes by `WHERE owner_id = $req.owner` (D2.2)
- `resolveOwner` Express middleware sets `req.owner = 'anonymous'` for every authenticated route (D2.2)
- This is the single seam for future auth — when auth lands, only the middleware body changes

#### Bootstrap (architecture's "First Implementation Priority")

- pnpm workspace monorepo: `apps/client/`, `apps/server/`, `packages/shared/`
- Vite 8 + React 19 + plugin-react v6 (Oxc) frontend, scaffolded via `pnpm create vite@latest apps/client -- --template react-ts`
- Express 5 + TypeScript 6 + Drizzle ORM 0.45 + pg backend, manually scaffolded
- `packages/shared` exports `Todo` types, Zod schemas, `ApiError` type
- docker-compose.yml runs Postgres 17 locally for dev (NFR-9 enabler)
- `tsconfig.base.json` + per-package extends; path aliases `@app/*`, `@server/*`, `@shared/*`
- ESLint flat config + Prettier at root
- Root `package.json` scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `db:generate`, `db:migrate`
- README documents bootstrap and includes the R-2 deployment-posture warning

#### Persistence epic prerequisites

- Drizzle schema `todos` table per D1.1 with CHECK constraint on `length(title) BETWEEN 1 AND 280`
- Drizzle Kit migration generated and committed
- `apps/server/src/db/client.ts` connection wiring with pg pool
- `apps/server/src/db/todos-repo.ts` exposes typed `create`, `list`, `update`, `delete` functions; only place SQL lives (per project structure)
- `apps/server/src/env.ts` Zod-validated env schema (D5.3): `DATABASE_URL`, `BIND`, `PORT`, `ALLOW_PUBLIC_BIND`, `LOG_LEVEL`, `NODE_ENV`

#### API epic prerequisites

- `/api/todos` REST endpoints per D3.1: GET (list), POST (create), PATCH /:id (update), DELETE /:id (delete)
- `/api/health` liveness endpoint
- `validate` middleware factory using Zod schemas from `@shared`
- `error-handler` middleware producing `{ "error": { "message", "code" } }` envelope per D3.3
- pino + pino-http structured logging (D5.4); `request_duration_ms` field for NFR-1
- helmet + CORS + body-size middleware per D2.3

#### Frontend epic prerequisites

- TanStack Query v5+ provider in `apps/client/src/main.tsx`
- `apps/client/src/lib/api-client.ts` fetch wrapper that parses error envelope and throws typed `ApiError`
- `apps/client/src/lib/perf.ts` Performance API marker helpers (NFR-2)
- Custom hooks `useTodos`, `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo` (D4.3)
- Components: `TodoList`, `TodoItem`, `NewTodoInput`, `EmptyState`, `LoadingIndicator`, `ErrorBanner` (per architecture project tree)
- Tailwind 4.x with `@tailwindcss/vite` plugin; default Tailwind breakpoints satisfy FR-11

#### CI / Security epic prerequisites

- `.github/workflows/ci.yml` runs lint + typecheck + test + coverage on every PR (NFR-8)
- `.github/workflows/lighthouse.yml` LCP gate (NFR-6)
- `.github/workflows/playwright.yml` cross-browser matrix (NFR-4)
- `public-bind-gate` middleware refuses non-loopback bind unless `ALLOW_PUBLIC_BIND=true` (D2.4); unit test included
- Helmet + CORS + body-size middleware wired up

#### Quality-gate epic prerequisites

- Chaos test in `apps/server/src/test/chaos.test.ts` injecting 500/timeout responses; asserts FR-9 + NFR-7 satisfied
- Persistence integration test (`persistence.int.test.ts`) covering FR-6 / NFR-3 (1000 add/refresh + cold restart)
- axe-core integration in Playwright spec for NFR-5
- Lighthouse CI configured for NFR-6
- Bootstrap walkthrough acceptance test (manual; tracked as a release readiness item) for NFR-9

### UX Design Requirements

_No UX Design document exists yet for this project. UX-shaped work items are folded into FR-driven stories and the architecture's component breakdown. A future `bmad-create-ux-design` pass with Sally would produce this section. For now, FR-5 / FR-7 / FR-8 / FR-9 / FR-11 / FR-12 implicitly carry the UX intent._

### FR Coverage Map

| FR | Epic | Story # | Notes |
|---|---|---|---|
| FR-1 (create) | Epic 2 | 2.4 | Mutation hook + form component, optimistic |
| FR-2 (list) | Epic 2 | 2.5 | Query hook + list component |
| FR-3 (toggle) | Epic 2 | 2.8 | Mutation hook + item component |
| FR-4 (delete) | Epic 2 | 2.9 | Mutation hook + item component |
| FR-5 (visual distinction) | Epic 2 | 2.10 | Tailwind treatment in TodoItem |
| FR-6 (persistence) | Epic 1 + Epic 2 + Epic 3 | 1.6 (mechanism), 2.5 (user-facing list returns persisted data), 3.4 (1000-cycle integration test) | Mechanism in Epic 1; user-facing acceptance in Epic 2; rigorous validation in Epic 3 |
| FR-7 (empty state) | Epic 2 | 2.6 | EmptyState component |
| FR-8 (loading state) | Epic 2 | 2.7 | LoadingIndicator component, driven by TanStack Query `isPending` |
| FR-9 (error state) | Epic 2 | 2.3 | ErrorBanner component + api-client error parsing + server error-handler middleware (2.2) |
| FR-10 (optimistic UI) | Epic 2 | 2.4, 2.8, 2.9 | Built into every mutation hook (architecture mandate) |
| FR-11 (responsive layout) | Epic 2 | 2.11 | Tailwind responsive utilities across all components |
| FR-12 (keyboard operability) | Epic 3 | 3.1 | Explicit a11y verification + visible focus indicators + Playwright a11y spec (3.2) |

### NFR Coverage Map

| NFR | Epic | Story # | Implementation |
|---|---|---|---|
| NFR-1 (API latency p95 <200ms) | Epic 1 + Epic 2 | 1.3 (logger) + 2.2 (instrumentation in middleware) | pino-http logs `request_duration_ms` |
| NFR-2 (UI latency 150ms median) | Epic 2 | 2.1 (perf.ts) + 2.4, 2.8, 2.9 (used in mutations) | `performance.mark()` instrumentation in mutation hooks |
| NFR-3 (durability) | Epic 1 + Epic 3 | 1.6 (mechanism) + 3.4 (1000-cycle test) | Postgres synchronous commit + integration test |
| NFR-4 (cross-browser) | Epic 3 | 3.3 | Playwright matrix workflow |
| NFR-5 (WCAG 2.1 AA) | Epic 3 | 3.2 | axe-core CI + manual VoiceOver/NVDA pass |
| NFR-6 (LCP <2s on Fast 3G) | Epic 3 | 3.6 | Lighthouse CI workflow gates merge |
| NFR-7 (error visible <1s) | Epic 2 + Epic 3 | 2.3 (ErrorBanner) + 3.5 (chaos test) | Chaos test injecting 500/timeout responses validates the path |
| NFR-8 (lint+types+coverage ≥80%) | Epic 1 | 1.9 | CI workflow + ESLint + tsc |
| NFR-9 (clean clone <10min) | Epic 1 + Epic 3 | 1.5 (docker-compose) + 1.9 + 3.7 (acceptance walkthrough) | Bootstrap story acceptance + quarterly walkthrough |

## Epic List

### Epic 1: Foundation & Bootstrap

**User outcome:** A developer can clone the repo, run a single bootstrap command, and have a working development environment (frontend + backend + Postgres) with safety rails enforced. The deployment-posture gate prevents accidentally exposing the no-auth shared dataset on a public URL.

**FRs covered:** Indirect — FR-6 (persistence layer mechanism: schema, migrations, repo)
**NFRs covered:** NFR-9 (bootstrap target), NFR-1 (instrumentation in place), NFR-8 (CI gates configured)
**Standalone value:** End-state demonstrates a runnable app skeleton (`/api/health` returns 200, Postgres connected, public-bind gate enforced, CI green on a stub PR). Demoable in PR review without any user-facing feature shipped.

### Epic 2: Personal Task Management (MVP)

**User outcome:** A user can capture, view, complete, and delete personal tasks. The entire functional product, end-to-end, with optimistic UI for sub-150ms feedback and durable persistence. Polished empty / loading / error states included.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 (user-facing acceptance), FR-7, FR-8, FR-9, FR-10, FR-11 — **11 of 12 FRs**
**NFRs covered:** NFR-1 (validated), NFR-2 (validated), NFR-3 (partial — durable in practice; full chaos validation in Epic 3)
**Standalone value:** This is the product. Shippable to an internal user. FR-10 (optimistic UI) intentionally lives here because the architecture mandates mutations go through TanStack Query hooks with optimistic patterns built in — splitting it from the mutation stories would force a rewrite.

### Epic 3: Quality, Accessibility & Cross-Browser Verification

**User outcome:** The app is verifiably accessible (keyboard + screen reader), works across all supported browsers, and meets all reliability gates. Users with assistive technology, slow connections, or non-Chrome browsers receive the same product.

**FRs covered:** FR-12 (keyboard operability — verified, not just functional)
**NFRs covered:** NFR-3 (full 1000-cycle integration test + cold restart), NFR-4 (Playwright matrix), NFR-5 (WCAG 2.1 AA), NFR-6 (Lighthouse CI gate), NFR-7 (chaos test), NFR-9 (acceptance walkthrough on a fresh environment)
**Standalone value:** Accessibility is a user-facing feature, not a footnote. This epic delivers verifiable cross-browser behavior, screen-reader operability, and reliability under failure conditions. Splits "it works" (Epic 2) from "it works for everyone, reliably" (Epic 3).

---

## Epic 1: Foundation & Bootstrap

A developer can clone the repo, run a single bootstrap command, and have a working development environment with safety rails enforced.

### Story 1.1: Bootstrap monorepo workspace structure

As a developer,
I want a configured pnpm workspace with shared TypeScript settings, lint, and format tooling,
So that subsequent stories have a consistent foundation to build on.

**Acceptance Criteria:**

**Given** a clean clone of the repo
**When** I run `pnpm install` from the root
**Then** dependencies install successfully across all workspaces
**And** root `tsconfig.base.json` defines path aliases `@app/*`, `@server/*`, `@shared/*`
**And** `pnpm-workspace.yaml` declares `apps/*` and `packages/*`
**And** root `package.json` defines scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `db:up`, `db:generate`, `db:migrate`
**And** ESLint flat config at root enforces: `no-console`, `no-restricted-imports` (no relative imports beyond one level), `no-restricted-syntax` (no `.then()` chains), `import/order`, `@typescript-eslint/no-floating-promises`
**And** Prettier config at root
**And** `.gitignore`, `.nvmrc` (Node 24 LTS), `.editorconfig` are checked in

### Story 1.2: Scaffold Vite + React + TypeScript frontend skeleton

As a developer,
I want a runnable Vite-based React frontend skeleton with Tailwind configured,
So that subsequent UI stories can build on a working dev server.

**Acceptance Criteria:**

**Given** Story 1.1 is complete
**When** I run `pnpm create vite@latest apps/client -- --template react-ts` and configure path aliases plus Tailwind
**Then** `apps/client` contains a Vite 8 + React 19 + TypeScript 6 setup
**And** Tailwind 4.x with `@tailwindcss/vite` plugin is installed and wired
**And** `App.tsx` renders a placeholder header (e.g., "Todo App")
**And** `pnpm --filter client dev` serves the page on localhost
**And** `pnpm --filter client build` produces `apps/client/dist/`
**And** `pnpm --filter client typecheck` passes

### Story 1.3: Scaffold Express + TypeScript backend skeleton

As a developer,
I want a runnable Express + TypeScript backend skeleton with structured logging,
So that subsequent server stories can build on a working dev server with a health endpoint.

**Acceptance Criteria:**

**Given** Story 1.1 is complete
**When** I scaffold `apps/server` with Express 5, TypeScript 6, tsx, pino, pino-http, helmet, cors
**Then** `apps/server/src/app.ts` exports an Express app factory (testable, no `listen` call)
**And** `apps/server/src/index.ts` is the process entry that calls `bootstrap()`
**And** `GET /api/health` returns 200 with `{ "status": "ok" }`
**And** `pnpm --filter server dev` runs via `tsx watch`
**And** `pnpm --filter server build` produces compiled JS via `tsc`
**And** `pnpm --filter server typecheck` passes

### Story 1.4: Shared types package with Todo and ApiError contracts

As a developer,
I want a `packages/shared` workspace package exporting the canonical `Todo` type, Zod schemas, and `ApiError` envelope type,
So that client and server have a single source of truth for cross-process contracts.

**Acceptance Criteria:**

**Given** Story 1.1 is complete
**When** I create `packages/shared` with TypeScript source
**Then** `packages/shared/src/todo.ts` exports `Todo`, `CreateTodoInput`, `UpdateTodoInput` types and matching Zod schemas
**And** `packages/shared/src/api.ts` exports `ApiError` type matching the error envelope shape `{ error: { message, code } }`
**And** `packages/shared/src/index.ts` re-exports all
**And** both `apps/client` and `apps/server` declare the workspace dep and successfully import `Todo` via `@shared`
**And** `MAX_TITLE_LENGTH = 280` is exported as a module-level constant from `packages/shared/src/todo.ts`

### Story 1.5: Local PostgreSQL via docker-compose

As a developer,
I want a single command that starts a local PostgreSQL 17 instance with persistent storage,
So that backend development does not require a host install.

**Acceptance Criteria:**

**Given** Story 1.1 is complete
**When** I run `pnpm db:up`
**Then** `docker-compose up -d` starts a Postgres 17 container with a named volume for persistence
**And** the container exposes Postgres on `localhost:5432`
**And** `.env.example` documents `DATABASE_URL` with the expected connection string format
**And** `.env.example` defaults `BIND=127.0.0.1`, `ALLOW_PUBLIC_BIND=false`, `LOG_LEVEL=info`, `NODE_ENV=development`
**And** README documents `pnpm db:up` and how to verify connectivity

### Story 1.6: Database schema, migrations, and todos repo with auth-ready seam

As a developer,
I want a typed Drizzle schema for the `todos` table with the auth-ready `owner_id` column and a repository module that contains all SQL,
So that future stories can rely on a stable persistence layer with the future-auth seam in place.

**Acceptance Criteria:**

**Given** Story 1.5 is complete
**When** I define `apps/server/src/db/schema.ts` with the Drizzle schema for the `todos` table
**Then** the schema includes: `id uuid PK DEFAULT gen_random_uuid()`, `owner_id text NOT NULL DEFAULT 'anonymous'`, `title text NOT NULL CHECK (length(title) BETWEEN 1 AND 280)`, `completed boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`
**And** an index `idx_todos_owner_created` on `(owner_id, created_at DESC)` exists
**And** `apps/server/src/db/client.ts` configures a pg pool and Drizzle client
**And** `apps/server/src/db/todos-repo.ts` exports typed `create`, `list`, `update`, `delete` functions; all queries scope by `owner_id` parameter
**And** `pnpm db:generate` produces a Drizzle Kit migration file in `apps/server/src/db/migrations/`
**And** `pnpm db:migrate` applies migrations cleanly to a fresh Postgres
**And** repo unit tests exercise each function against a clean DB and pass

### Story 1.7: Env validation and resolveOwner middleware

As a developer,
I want the server to validate its environment at boot and inject `req.owner` for every authenticated request,
So that misconfigurations fail fast and every route operates inside the future-auth seam from day one.

**Acceptance Criteria:**

**Given** Stories 1.3 and 1.6 are complete
**When** I add `apps/server/src/env.ts` with a Zod env schema covering `DATABASE_URL`, `BIND`, `PORT`, `ALLOW_PUBLIC_BIND`, `LOG_LEVEL`, `NODE_ENV`
**Then** the server crashes at boot with a descriptive error if any required env var is missing or invalid
**And** `apps/server/src/middleware/resolve-owner.ts` is added; it sets `req.owner = 'anonymous'` for every request
**And** `app.ts` wires `resolveOwner` to run before all `/api/*` routes
**And** an integration test asserts `req.owner === 'anonymous'` is set on a sample protected route

### Story 1.8: Public-bind safety gate

As a developer / operator,
I want the server to refuse to start on a public network interface unless I explicitly allow it,
So that the no-auth shared dataset is never exposed by accident.

**Acceptance Criteria:**

**Given** Stories 1.3 and 1.7 are complete
**When** I add `apps/server/src/middleware/public-bind-gate.ts` (a startup check, run inside `bootstrap()` before `listen()`)
**Then** the server starts normally with `BIND=127.0.0.1` regardless of `ALLOW_PUBLIC_BIND`
**And** the server starts normally with `BIND=0.0.0.0 ALLOW_PUBLIC_BIND=true`
**And** the server **exits with a descriptive error** if `BIND` resolves to a non-loopback address and `ALLOW_PUBLIC_BIND` is not `true`
**And** unit tests in `apps/server/src/test/public-bind-gate.test.ts` cover all three cases
**And** README has a prominent warning section explaining R-2 (no auth + public URL = open shared list) and the gate's purpose

### Story 1.9: CI pipeline — lint, type-check, test, coverage

As a developer / maintainer,
I want every PR gated by lint, type-check, and test passes with ≥80% coverage on critical paths,
So that broken changes cannot merge.

**Acceptance Criteria:**

**Given** Stories 1.1 through 1.8 are complete
**When** I add `.github/workflows/ci.yml` triggered on PRs and pushes to `main`
**Then** the workflow runs: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test --coverage`
**And** coverage reports for `apps/server` route handlers and `apps/client` hooks/state-management are aggregated
**And** the workflow fails if line coverage on those targets falls below 80% per NFR-8
**And** a deliberately broken stub PR (failing lint or test) produces red CI
**And** a passing stub PR produces green CI

---

## Epic 2: Personal Task Management (MVP)

A user can capture, view, complete, and delete personal tasks. Full functional product with optimistic UI and durable persistence.

### Story 2.1: TanStack Query setup and api-client wrapper

As a developer,
I want TanStack Query and a shared `api-client` fetch wrapper installed and wired in the client,
So that subsequent stories can use uniform query/mutation hooks with consistent error parsing.

**Acceptance Criteria:**

**Given** Stories 1.2 and 1.4 are complete
**When** I install `@tanstack/react-query` v5+ and add `apps/client/src/lib/query-client.ts`, `apps/client/src/lib/api-client.ts`, `apps/client/src/lib/perf.ts`
**Then** `main.tsx` wraps `App` in `<QueryClientProvider>` with a single `QueryClient` instance
**And** `api-client.ts` exposes `get`, `post`, `patch`, `delete` helpers that parse error envelopes from the server and throw typed `ApiError`
**And** `perf.ts` exposes `markStart(name)` and `markEnd(name)` helpers using `performance.mark` and `performance.measure` per NFR-2
**And** a smoke test from a `useQuery` hook against `GET /api/health` returns 200 and renders successfully
**And** simulated 500 response from the server causes `ApiError` to be thrown with the parsed `code` and `message`

### Story 2.2: Server error envelope, validation middleware, and security middleware

As a developer,
I want the server to consistently produce error envelopes, validate every request via Zod, and apply baseline security middleware,
So that subsequent route stories can rely on a uniform error and validation contract.

**Acceptance Criteria:**

**Given** Stories 1.3 and 1.4 are complete
**When** I add `apps/server/src/middleware/error-handler.ts`, `apps/server/src/middleware/validate.ts`, and wire helmet, CORS, body-size limit in `app.ts`
**Then** thrown errors from any layer are caught and translated to `{ "error": { "message": string, "code": string } }` JSON with the appropriate HTTP status (400 / 404 / 500)
**And** `validate.ts` is a factory `validate(schema)` returning Express middleware that validates `req.body` (or `req.query` / `req.params`) against a Zod schema and returns 400 with `VALIDATION_FAILED` on failure
**And** helmet is applied to all responses (default config)
**And** CORS allowlists the dev client origin (configurable via env), same-origin in production
**And** `express.json({ limit: '8kb' })` caps body size
**And** pino + pino-http log every request with a `request_duration_ms` field per NFR-1

### Story 2.3: Inline error banner for backend failures (FR-9)

As a user,
I want to see a clear, dismissible error message when something goes wrong,
So that I'm not confused by silently failing actions.

**Acceptance Criteria:**

**Given** Stories 2.1 and 2.2 are complete
**When** I add an `ErrorBanner` component and a small global error-state hook (e.g., `useErrorBanner()` exposing `setError`, `dismiss`)
**Then** **Given** an error message is set in state, **Then** `ErrorBanner` renders inline (non-modal), shows the message, and exposes a dismiss control
**And** **Given** the dismiss control is activated, **Then** the banner disappears and state is cleared
**And** **Given** no error is set, **Then** `ErrorBanner` is not rendered
**And** the component uses inline (non-modal) presentation so it does not block typing or scrolling
**And** unit tests cover render-with-message, dismiss, no-render-when-empty
**And** subsequent mutation stories (2.4, 2.8, 2.9) wire their `onError` callbacks to call `setError(message)` and verify the banner appears within 1s of the failed call (per NFR-7)

### Story 2.4: User can create a todo (FR-1, FR-10)

As a user,
I want to add a new task by typing its text and submitting,
So that I can capture something I need to do.

**Acceptance Criteria:**

**Given** Stories 1.6, 2.1, 2.2, and 2.3 are complete
**When** I add a `POST /api/todos` route, a `useCreateTodo` hook, a `NewTodoInput` component, and the `createTodoSchema` in `@shared`
**Then** **Given** I have typed valid text, **When** I submit, **Then** the new todo appears in the list within 50ms (optimistic) and is persisted server-side with `created_at` recorded
**And** **Given** blank or whitespace-only input, **When** I submit, **Then** the server returns 400 with `code: VALIDATION_FAILED` and the input field retains its value
**And** **Given** input >280 characters, **When** I submit, **Then** the server returns 400 and the input is preserved
**And** **Given** the server returns 500, **When** the request fails, **Then** the optimistic insert rolls back and `ErrorBanner` (from Story 2.3) appears within 1s with the failed-operation context

### Story 2.5: User sees their existing todos on app load (FR-2)

As a user,
I want my existing tasks to be visible when I open the app,
So that I don't lose track of what I've already captured.

**Acceptance Criteria:**

**Given** Stories 1.6, 2.1, and 2.2 are complete
**When** I add a `GET /api/todos` route, a `useTodos` hook, and a `TodoList` component
**Then** **Given** the app loads, **Then** the list of todos renders within 500ms p95 (with ≤50 todos)
**And** todos are ordered by `created_at` descending (newest first)
**And** both active and completed todos are visible
**And** the route scopes by `req.owner` (Decision 1 seam — passes existing tests)

### Story 2.6: Empty state UI (FR-7)

As a first-time user,
I want a friendly empty state inviting me to create my first task,
So that I know what to do on initial load without needing instructions.

**Acceptance Criteria:**

**Given** Stories 2.1 and 2.5 are complete
**When** I add an `EmptyState` component
**Then** **Given** the todo count is 0, **Then** `EmptyState` renders with a message inviting task creation and a focus-able CTA pointing to `NewTodoInput`
**And** the empty state uses no error styling (not red, not warning iconography)
**And** **Given** the todo count > 0, **Then** `EmptyState` is not rendered

### Story 2.7: Loading state UI (FR-8)

As a user,
I want a non-blocking loading indicator while my todos are being fetched,
So that slow loads don't feel like the app is broken.

**Acceptance Criteria:**

**Given** Stories 2.1 and 2.5 are complete
**When** I add a `LoadingIndicator` component driven by `useTodos().isPending`
**Then** **Given** the initial fetch is in flight for >200ms, **Then** the indicator becomes visible
**And** **Given** the fetch completes, **Then** the indicator is replaced by either `TodoList` (with data) or `EmptyState` (when count = 0)
**And** the indicator never displays alongside a populated list

### Story 2.8: User can toggle a task's completion state (FR-3, FR-10)

As a user,
I want to mark a task complete or uncomplete with a single click,
So that I can keep my list current as I finish things.

**Acceptance Criteria:**

**Given** Stories 1.6, 2.1, 2.2, 2.3, and 2.5 are complete
**When** I add a `PATCH /api/todos/:id` route, a `useUpdateTodo` hook, and a `TodoItem` component with a toggle control
**Then** **Given** an active todo, **When** I click the toggle, **Then** the completion state flips within 50ms (optimistic) and persists
**And** **Given** an already-completed todo, **When** I toggle it twice quickly, **Then** the final persisted state is unchanged (idempotent per D3.2)
**And** **Given** the server returns 500, **Then** the optimistic toggle rolls back and `ErrorBanner` (from Story 2.3) appears within 1s

### Story 2.9: User can delete a todo (FR-4, FR-10)

As a user,
I want to remove a task I no longer need,
So that my list stays focused.

**Acceptance Criteria:**

**Given** Stories 1.6, 2.1, 2.2, 2.3, and 2.5 are complete
**When** I add a `DELETE /api/todos/:id` route, a `useDeleteTodo` hook, and a delete control on `TodoItem`
**Then** **Given** a todo, **When** I click delete, **Then** the item disappears from the list within 50ms (optimistic) and is persisted-deleted
**And** **Given** I refresh the page, **Then** the deleted todo does not return
**And** **Given** I attempt to delete a non-existent ID (already deleted), **Then** the server returns 204 (idempotent — no 404 per D3.2)
**And** **Given** the server returns 500, **Then** the item reappears via rollback and `ErrorBanner` (from Story 2.3) appears within 1s

### Story 2.10: Visual distinction between active and completed todos (FR-5)

As a user,
I want completed todos to look visually distinct from active ones,
So that I can see at a glance what is still outstanding.

**Acceptance Criteria:**

**Given** Story 2.8 is complete
**When** I update `TodoItem` to apply Tailwind classes conditionally on `completed`
**Then** **Given** a completed todo, **Then** its title text is rendered with strikethrough and reduced opacity
**And** the distinction is operable in greyscale (does not rely on color alone)
**And** the contrast ratio between active and completed text states is ≥ 3:1
**And** an active and a completed todo are visually distinguishable to a reviewer in a screenshot diff

### Story 2.11: Responsive layout from 320px to 1920px (FR-11)

As a user on any device,
I want the app to render usably on my screen size,
So that I can use it on phone or desktop without horizontal scrolling.

**Acceptance Criteria:**

**Given** Stories 2.3 through 2.10 are complete
**When** I configure Tailwind breakpoints and apply responsive utilities across all components
**Then** **Given** a 320px viewport, **Then** no horizontal scroll appears and all controls remain operable
**And** **Given** a 1920px viewport, **Then** the layout is constrained (max-width container) so content does not appear stretched
**And** **Given** input fields, **Then** font-size is ≥ 16px to suppress mobile auto-zoom
**And** automated responsive tests cover at least: 320, 640, 768, 1024, 1920px

---

## Epic 3: Quality, Accessibility & Cross-Browser Verification

The app is verifiably accessible, works across all supported browsers, and meets all reliability gates.

### Story 3.1: Keyboard operability and visible focus indicators (FR-12)

As a keyboard-only user,
I want to perform every action (create, toggle, delete, dismiss errors) using the keyboard,
So that I can use the app without a mouse.

**Acceptance Criteria:**

**Given** Epic 2 is complete
**When** I audit and update all interactive elements
**Then** **Given** I press Tab from a fresh page load, **Then** the focus order is logical: NewTodoInput → first TodoItem (toggle, then delete) → second TodoItem → … → ErrorBanner dismiss (when present)
**And** **Given** focus on `NewTodoInput`, **When** I press Enter, **Then** the new todo is submitted
**And** **Given** focus on a TodoItem's toggle, **When** I press Space or Enter, **Then** completion state toggles
**And** **Given** focus on a TodoItem's delete control, **When** I press Enter or Space, **Then** the todo is deleted
**And** every interactive element has a visible focus indicator (Tailwind `focus-visible:ring-*`) with sufficient contrast

### Story 3.2: axe-core accessibility validation in CI (NFR-5)

As a developer / accessibility advocate,
I want axe-core to run in CI against every page state,
So that accessibility regressions are caught on PR.

**Acceptance Criteria:**

**Given** Stories 3.1, 2.5, 2.6, and 2.10 are complete
**When** I add `apps/client/src/test/e2e/a11y.spec.ts` (Playwright + axe-core integration)
**Then** the spec exercises three states: empty, populated (3 todos), and error-banner-visible
**And** axe-core finds zero serious or critical violations on a clean PR
**And** `.github/workflows/ci.yml` runs the a11y spec; failures block merge
**And** a deliberate violation (e.g., remove an aria-label) causes the workflow to fail

### Story 3.3: Cross-browser Playwright matrix (NFR-4)

As a user on Firefox / Safari / Edge,
I want the app to function identically to Chrome,
So that my browser choice does not break my workflow.

**Acceptance Criteria:**

**Given** Epic 2 is complete
**When** I add `apps/client/src/test/e2e/core-flow.spec.ts` and `.github/workflows/playwright.yml`
**Then** the spec covers the full happy-path: load app, create todo, toggle, delete, refresh, see persisted state
**And** the workflow runs the spec on Chromium, WebKit, and Firefox (mapping to Chrome, Safari, Firefox/Edge)
**And** the spec passes on all three browsers on a clean PR
**And** the workflow runs nightly + on release-cut branches per the architecture's cadence

### Story 3.4: Persistence integration test (FR-6 + NFR-3)

As a developer / reliability advocate,
I want a real-DB integration test verifying durability across operations and restarts,
So that NFR-3 is provably enforced.

**Acceptance Criteria:**

**Given** Stories 1.6 and 2.4 are complete
**When** I add `apps/server/src/test/persistence.int.test.ts` running against a docker-compose-managed Postgres
**Then** the test issues 1000 sequential `POST /api/todos` calls then asserts `GET /api/todos` returns all 1000 records
**And** the test simulates a server restart (stop + start) between writes and reads, asserting all written records remain
**And** the test passes deterministically on a clean DB
**And** the test runs as part of CI (separate workflow job, allowing slower DB-backed execution)

### Story 3.5: Chaos test for error recovery (NFR-7)

As a developer / reliability advocate,
I want chaos tests that inject backend failures and verify the client surfaces errors within 1s,
So that NFR-7 is provably enforced.

**Acceptance Criteria:**

**Given** Stories 2.3 (ErrorBanner) and 2.4 / 2.8 / 2.9 (mutation hooks) are complete
**When** I add `apps/server/src/test/chaos.test.ts`
**Then** the test injects 500 responses on each of POST / PATCH / DELETE `/api/todos` endpoints (via test seam)
**And** for each scenario, asserts the client `ErrorBanner` is set within 1s
**And** the test injects timeout responses (server delays beyond client timeout) and asserts the client gives up at the configured timeout (1s) and surfaces an error
**And** the test passes deterministically

### Story 3.6: Lighthouse CI gate for LCP (NFR-6)

As a developer / performance advocate,
I want Lighthouse CI to enforce LCP <2.0s on Fast 3G,
So that NFR-6 is provably enforced and bundle regressions are caught.

**Acceptance Criteria:**

**Given** Epic 2 is complete
**When** I add `.github/workflows/lighthouse.yml` and a Lighthouse CI configuration
**Then** the workflow builds the client, seeds 50 todos in a fixture DB, serves the build, and runs Lighthouse with Fast 3G throttling
**And** the LCP threshold is 2.0s; the workflow fails the PR if exceeded
**And** a regression PR (e.g., adds a 500kb dependency) produces a red workflow
**And** a clean PR produces green

### Story 3.7: Bootstrap walkthrough acceptance (NFR-9)

As a developer / new contributor,
I want the bootstrap procedure documented in the README and validated quarterly by a fresh developer,
So that NFR-9's <10-minute target stays honest over time.

**Acceptance Criteria:**

**Given** Epic 1 is complete
**When** I update the README with the full bootstrap procedure
**Then** the README documents: clone, `pnpm install`, `pnpm db:up`, `pnpm db:migrate`, `pnpm dev`, expected URLs and ports
**And** the README documents the R-2 deployment-posture warning prominently
**And** a quarterly process item is created (recurring task in project ops): "Have a developer not previously on the project clone and run in <10 minutes; report any friction"
**And** the first walkthrough is scheduled


