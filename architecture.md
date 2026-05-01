---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-29'
inputDocuments:
  - '/Users/scottstewart/Desktop/todo-app/_bmad/prd.md'
  - '/Users/scottstewart/Desktop/todo-app/_bmad/validation-report-2026-04-29.md'
workflowType: 'architecture'
project_name: 'todo-app'
user_name: 'Scott'
architect: 'Winston (BMad Architect)'
date: '2026-04-29'
---

# Architecture Decision Document — Todo App

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Inputs Loaded

- **PRD:** `/Users/scottstewart/Desktop/todo-app/_bmad/prd.md` — BMAD Standard, validated PASS (5/5 holistic quality, 0 critical issues)
- **Validation Report:** `/Users/scottstewart/Desktop/todo-app/_bmad/validation-report-2026-04-29.md`

## Outstanding from PRD

Three open items inherited from the PRD validation:

1. ~~**TA-5 / R-1** — Persistence scoping~~ → ✅ **Resolved 2026-04-29 by stakeholder:** "basic persistence with postgres, but leave the infrastructure open to auth scoping in the future." Architecture must design a future-auth-ready seam (see Decision 1 below).
2. **SC-3** — Latency target deployment context: development-environment target documented; production target needs sharpening if deployment posture changes.
3. **R-2** — No-auth + public URL footgun: architecture should at minimum document the safe deployment posture; may consider enforcing it.

## Decision 1 — Persistence & Auth-Ready Seam (TA-5 follow-through)

**Decision:** Server-side PostgreSQL persistence. Single anonymous shared dataset for v1. Schema and middleware designed to make future per-user auth a localized change.

**Selected approach:** ✅ **Option C** — confirmed by stakeholder 2026-04-29.

**Options considered:**

- **A — `owner_id` nullable, no middleware.** Cheapest v1 (~0 LOC). When auth lands: backfill data, add NOT NULL, rewrite every query to scope by owner. **Rejected** — pushes the cost onto future-us, exactly the migration we said we'd avoid.
- **B — `owner_id` NOT NULL with default `'anonymous'`, no middleware.** Schema is auth-shaped, but server code is not. When auth lands: still need to add ownership middleware and audit query call sites. **Rejected** — half-built seam.
- **C — `owner_id` NOT NULL with default `'anonymous'` + `resolveOwner` Express middleware that sets `req.owner` for every route.** Schema *and* request lifecycle are auth-shaped from day one. When auth lands: replace the middleware body, add a user table, flip the default. Zero query changes, zero data migration. **Recommended.**

**Trade-off:** Option C costs ~30 LOC in v1 we don't strictly need (a middleware that always returns `'anonymous'` plus a query parameter that's always the same). The payoff is one-file auth integration later. For a project with TA-5 explicitly asking for this seam, C is honest to the requirement.

**Implications:**
- All read/write queries scope by `owner_id` from day one (`WHERE owner_id = $req.owner`).
- The `'anonymous'` literal is treated as a real owner identifier, not a null sentinel.
- Future migration to real auth = swap middleware body + add `users` table + change default. Existing data either stays as `'anonymous'` (read-only legacy) or is reassigned via a one-shot migration.

## Project Context Analysis

### Requirements Overview

**Functional Requirements (12 total):**
- Backend-shaped: CRUD + persistence (FR-1, FR-2, FR-3, FR-4, FR-6) — 5 FRs
- Frontend-shaped: UX states, optimistic UI, responsive, keyboard a11y (FR-5, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12) — 7 FRs

**Non-Functional Requirements (9 total) — drivers for architecture:**
- Latency: NFR-1 (API p95 <200ms, p99 <500ms), NFR-2 (UI confirmation 150ms median, 300ms p95), NFR-6 (LCP <2.0s on Fast 3G)
- Reliability: NFR-3 (100% durability across backend restart), NFR-7 (error surface within 1s of failure)
- Quality: NFR-5 (WCAG 2.1 AA), NFR-8 (lint + type-check + ≥80% line coverage in CI), NFR-9 (<10 min from clean clone to running app)
- Compatibility: NFR-4 (latest 2 versions of Chrome / Firefox / Safari / Edge)

**Scale & Complexity:**
- Primary domain: Full-stack web
- Complexity level: **Low** (no real-time, no multi-tenancy, no compliance, no integrations)
- Deployable artifacts: 3 (client bundle, Express server, PostgreSQL)
- Logical modules: ~5–7 per side

### Technical Constraints & Dependencies

- **Stack constraints (TA-1, TA-2, TA-3):** React, Express.js on Node.js LTS, PostgreSQL — locked by stakeholder.
- **Language:** TypeScript end-to-end — confirmed by stakeholder 2026-04-29. Drives shared types between client and server, satisfies NFR-8 type-check gate.
- **API style (TA-4):** REST under `/api/todos` — starting position from PRD; final shape ratified later in this architecture document.
- **Deployment topology (TA-6):** single-tenant; web client + one backend instance + one Postgres instance; no horizontal scale required for v1.
- **Auth posture (TA-5):** anonymous shared dataset with future-auth-ready seam (per Decision 1).

### Cross-Cutting Concerns Identified

| Concern | Architectural Impact |
|---|---|
| **Shared `Todo` types between client and server** | Likely a shared TypeScript types module imported by both sides; prevents drift. |
| **Owner resolution middleware** | Applies to every backend route (per Decision 1). |
| **Observability** | Server-side request timing instrumentation + client-side Performance API marks. Without these, NFR-1 and NFR-2 cannot be measured. |
| **Test strategy** | Runner choice (Vitest / Jest) + unit + integration + chaos tests to satisfy NFR-8 coverage and NFR-7 error-surface targets. |
| **Bootstrap UX** | Clean clone → running app in <10 minutes (NFR-9). Likely `docker-compose` for Postgres + npm scripts for client/server. |
| **Deployment-posture safety** | R-2 footgun (no auth + public URL = open shared list). Architecture should document the safe deployment mode and ideally make unsafe configurations hard to reach by accident. |

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web** — locked to React (frontend) + Express (backend) + PostgreSQL (datastore) + REST (API style) + TypeScript (language) by stakeholder constraints (TA-1 through TA-4 + Decision: TypeScript end-to-end).

### Starter Options Considered

The PRD's stack constraints rule out the popular opinionated full-stack starters:

| Starter | Why it does not fit |
|---|---|
| T3 (`create-t3-app`) | Forces Next.js + tRPC; conflicts with TA-2 (Express) and TA-4 (REST). |
| RedwoodJS | Forces GraphQL; conflicts with TA-4 (REST). |
| Blitz.js | Effectively unmaintained. |
| MERN/PERN GitHub starters | Quality varies wildly; most stale or carry hidden opinions. Higher risk than scaffolding fresh. |

**Conclusion:** No single starter CLI matches the locked stack. The right move is a **scaffold strategy** (two minimal `create-*` commands + a thin monorepo wrapper) rather than picking a misfit framework.

### Selected Approach: pnpm Workspace Monorepo

```
todo-app/
├── apps/
│   ├── client/          # Vite + React 19 + TypeScript + Vitest + Tailwind
│   └── server/          # Express 5 + TypeScript + Drizzle ORM + Vitest
├── packages/
│   └── shared/          # Shared TypeScript types (Todo, API contracts)
├── docker-compose.yml   # Local Postgres 17 for dev
├── package.json         # Workspace root + scripts
└── pnpm-workspace.yaml
```

**Rationale for monorepo:** NFR-9 (clean clone → running app in <10 minutes) is materially easier with one `pnpm install` and one `pnpm dev`. Shared `Todo` types between client and server (cross-cutting concern from §Project Context) live in a workspace package — eliminates contract drift.

### Verified Current Versions (web-checked 2026-04-29)

| Tool | Version | Source |
|---|---|---|
| React | 19.2 | Current stable |
| Vite | 8.0 (Rolldown bundler, plugin-react v6 with Oxc) | [vite.dev](https://vite.dev/blog/announcing-vite8) |
| TypeScript | 6.0 | 2026 baseline |
| Node.js | 24 LTS | Current default |
| Express | 5.0 (production-recommended as of April 2026) | [expressjs.com](https://expressjs.com/2024/10/15/v5-release.html) |
| Drizzle ORM | 0.45.2 stable (v1.0.0-beta active; stable 0.45.x = safe production pick) | [orm.drizzle.team](https://orm.drizzle.team/) |
| Vitest | latest stable | Vite-native |
| PostgreSQL | 17 | Latest stable |

**Note:** Verify these versions are still current at scaffold time. Bootstrap story should pin major versions in `package.json` as initial constraints.

### Architectural Decisions Provided by Scaffold

**Confirmed by stakeholder 2026-04-29:**

| Layer | Decision | Rationale |
|---|---|---|
| Language & runtime | TypeScript 6 across all 3 packages, Node 24 LTS | Satisfies NFR-8 type-check gate; shared types between client/server |
| Frontend build | Vite 8 + React 19 + plugin-react v6 (Oxc) | Fast dev server; minimal config; trivially satisfies NFR-6 (LCP <2s) |
| Backend build | `tsx` for dev (hot reload), `tsc` for production build | Standard Node-TS pattern; no extra abstraction |
| Server framework | Express 5 | Stack constraint (TA-2); production-recommended in 2026 |
| Styling | **TailwindCSS** (Vite plugin) | Utility classes are a clean fit for FR-5 (active vs completed visual state) |
| Database access | **Drizzle ORM + Drizzle Kit** (migrations) | TypeScript-first, lightweight, SQL-native — fits "boring tech + close to the metal" |
| Local Postgres | **docker-compose.yml** brings up Postgres 17 on `pnpm dev` | Satisfies NFR-9 bootstrap target without requiring host Postgres install |
| Workspace tooling | **pnpm** workspaces | Faster than npm; dominant for monorepos in 2026 |
| Testing | Vitest in both packages + supertest (server) + React Testing Library (client) | One runner across the stack; consistent DX |
| Linting / formatting | ESLint flat config + Prettier | Current standard |
| Code organization | `apps/` for deployables, `packages/` for shared code | Conventional pnpm/Turborepo layout |
| Shared types | `packages/shared/src/todo.ts` — `Todo`, `CreateTodoInput`, `UpdateTodoInput`, etc., imported by both client and server | Single source of truth for API contracts |
| Dev command | `pnpm dev` runs `docker-compose up -d` + client + server concurrently | Single-command bootstrap |

### Initialization Sketch (Bootstrap Story)

```bash
# Frontend
pnpm create vite@latest apps/client -- --template react-ts

# Backend (manual scaffold; no canonical CLI for Express + TS)
mkdir -p apps/server && cd apps/server
pnpm init
pnpm add express drizzle-orm pg
pnpm add -D @types/express @types/pg drizzle-kit tsx vitest typescript

# Shared types package
mkdir -p packages/shared/src
cd packages/shared && pnpm init
```

**Note:** Project initialization using these (and follow-on) commands should be the **first implementation story** ("Bootstrap repo"). Exact tsconfig paths, package.json scripts, and Tailwind config wiring are pinned down at story time.

## Core Architectural Decisions

All decisions below confirmed by stakeholder 2026-04-29.

### Decision Priority

**Critical (block implementation):** D1.1, D1.2, D2.2, D2.4, D3.1, D3.4, D4.3, D4.5, D5.3
**Important (shape architecture):** D1.3, D2.3, D3.2, D3.3, D4.1, D4.2, D4.4, D4.6, D5.2, D5.4, D5.5
**Deferred (post-MVP):** D1.4 (caching), D3.3 sub (OpenAPI), D5.1 (prod hosting), D5.6 (scaling), rate limiting (D2.3 sub)

### Data Architecture

| ID | Decision | Rationale |
|---|---|---|
| **D1.1** | `todos` table schema: `id uuid PK`, `owner_id text NOT NULL DEFAULT 'anonymous'`, `title text NOT NULL` (length 1–280, enforced via DB CHECK constraint and Zod), `completed boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`. Index: `(owner_id, created_at DESC)` for FR-2 ordering. | Future-auth-ready (Decision 1). UUID over serial avoids enumeration leak if R-2 is ever triggered. 280 cap matches FR-1. Compound index supports FR-2's "newest first" ordering. |
| **D1.2** | Input validation via **Zod** at the API boundary; types inferred and re-exported via `packages/shared`. | Zod is the dominant TS validation lib in 2026; one schema definition serves both client form validation and server request validation. |
| **D1.3** | Migrations via **Drizzle Kit** (`drizzle-kit generate` produces SQL from TS schema; `drizzle-kit migrate` applies). Auto-applied on `pnpm dev`; manual `pnpm db:migrate` in any future prod. | Implicit pairing with Drizzle. No reason to mix tools. |
| **D1.4** | **No caching** in v1. | Single anonymous user; ≤50 todos baseline (NFR-6); localhost Postgres easily satisfies NFR-1's 200ms p95. Defer to performance pass if numbers ever fail. |

### Authentication & Security

| ID | Decision | Rationale |
|---|---|---|
| **D2.1** | **No authentication** in v1 (TA-5 resolved). | Stakeholder direction. |
| **D2.2** | **Authorization seam:** `resolveOwner` Express middleware sets `req.owner = 'anonymous'` for every authenticated route. All read/write queries scope by `WHERE owner_id = $req.owner`. | Decision 1 implementation. Future auth = swap middleware body. |
| **D2.3** | **Security middleware stack:** `helmet()` (security headers) + `cors()` (allowlist client origin in dev, same-origin in prod) + `express.json({ limit: '8kb' })`. **No rate limiting** in v1. | Helmet is one line for sensible defaults. 8kb body cap protects against simple abuse. Rate-limiting needs identities; revisit when auth lands. |
| **D2.4** | **R-2 mitigation:** (a) `.env.example` defaults `BIND=127.0.0.1` (localhost-only out of the box); (b) prominent README warning; (c) **`ALLOW_PUBLIC_BIND` gate enabled** — server refuses to start on `0.0.0.0` (or any non-loopback bind) unless `ALLOW_PUBLIC_BIND=true`. | Default-safe deployment posture. Explicit env var ensures public exposure of the no-auth dataset is always a deliberate choice, never an accident. _If stakeholder later prefers warning-only (no startup gate), flip a single check in `apps/server/src/index.ts`._ |

### API & Communication

| ID | Decision | Rationale |
|---|---|---|
| **D3.1** | **Endpoints (ratifies TA-4):** `GET /api/todos` (list), `POST /api/todos` (create), `PATCH /api/todos/:id` (update — partial or full), `DELETE /api/todos/:id` (delete), `GET /api/health` (liveness probe). | Conventional REST. PATCH carries target state (`{ "completed": true }`) — naturally idempotent. |
| **D3.2** | **Idempotency:** All endpoints idempotent at URL level. `DELETE` on a missing or already-deleted ID returns `204 No Content` (no `404`). `PATCH` with current target state is a no-op. | Explicit support for FR-3 (toggle idempotent on double-fire) and FR-4 (delete idempotent on missing ID). Aligns with TanStack Query's retry-on-network-error semantics. |
| **D3.3** | **Error format:** Plain HTTP status code + JSON body `{ "error": { "message": string, "code": string } }`. Codes are short stable strings (e.g., `TODO_NOT_FOUND`, `VALIDATION_FAILED`). | Predictable, minimal, easy to consume from the client. RFC 7807 (`application/problem+json`) is "more correct" but overkill for 4 endpoints. Revisit if a third party ever consumes the API. |
| **D3.4** | **API contract:** Shared TypeScript types in `packages/shared/src/api.ts` are the canonical contract. JSDoc on each route handler documents behavior. **No OpenAPI/Swagger in v1.** | Internal API, single consumer (the bundled client), 4 endpoints. Types are sufficient. |

### Frontend Architecture

| ID | Decision | Rationale |
|---|---|---|
| **D4.1** | **Component tree:** `App` → `TodoList` → `TodoItem`; sibling `NewTodoInput`; state-component siblings `EmptyState`, `LoadingIndicator`, `ErrorBanner`. ~6–7 components. | Smallest tree that satisfies all FRs cleanly. State components (FR-7/8/9) split from `TodoList` for clean unit testing. |
| **D4.2** | **No routing.** Single-page UI. | One screen; React Router would be dead weight. Trivially added later if app grows to multiple screens. |
| **D4.3** | **Server state: TanStack Query v5+** for fetches and mutations. Custom hooks per resource: `useTodos()`, `useCreateTodo()`, `useUpdateTodo()`, `useDeleteTodo()`. | Built-in optimistic updates (perfect for FR-10), automatic refetch on focus, cache invalidation. Manual `useEffect` fetching reimplements much of this. SWR is the alternative; TanStack Query has stronger optimistic-mutation ergonomics. |
| **D4.4** | **Local UI state: `useState`** for the new-todo form input and component-local UI concerns. No global store (no Zustand, Redux, Context). | At this scale there's effectively no *shared* local state. Server state lives in TanStack Query's cache. |
| **D4.5** | **Optimistic UI (FR-10):** TanStack Query mutations with `onMutate` (apply to cache optimistically), `onError` (rollback via previous cache snapshot), `onSettled` (invalidate to trigger reconciliation refetch). Last-write-wins per TA-7. | Canonical TanStack Query pattern. ~10 LOC per mutation. NFR-7's "error visible within 1s" satisfied via `onError`. |
| **D4.6** | **Bundle/perf:** Default Vite chunk splitting; no manual code-splitting in v1. Tailwind JIT via `@tailwindcss/vite` plugin. | NFR-6 (LCP <2s on Fast 3G) comfortably met by default Vite output for an app this size. Revisit if bundle grows past ~150kb gzipped. |

### Infrastructure & Deployment

| ID | Decision | Rationale |
|---|---|---|
| **D5.1** | **Production hosting: deferred.** | No production target named yet. Architecture is host-agnostic (any Node + Postgres host: Fly, Render, Railway, self-hosted). Revisit when a real target emerges. |
| **D5.2** | **CI/CD: GitHub Actions.** Single workflow on PR runs: lint (ESLint), type-check (`tsc --noEmit`), test (Vitest in both packages), coverage report. Required to merge per NFR-8. | De facto OSS-style choice. Workflow files checked into `.github/workflows/`. |
| **D5.3** | **Env config:** `dotenv` for loading; **Zod-validated env schema** in `apps/server/src/env.ts`. Server crashes at boot on missing/invalid env vars with a descriptive error. `.env.example` checked into repo. | Crash early, crash loud. 30 LOC of Zod validation prevents an entire class of "I forgot to set X" production incidents. |
| **D5.4** | **Logging:** `pino` structured JSON to stdout. `pino-pretty` for dev formatting. `pino-http` middleware logs `request_duration_ms` per request. | Boring, standard, fast. Structured logs plug cleanly into any future aggregator. |
| **D5.5** | **Observability hooks:** Server-side request timing via `pino-http`. Client-side `performance.mark()` and `performance.measure()` around mutation invocations; results visible in DevTools Performance panel and `console.debug` in dev. | Minimum viable instrumentation to *measure* compliance with NFR-1 and NFR-2 — without measurement, those NFRs are aspirations not requirements. |
| **D5.6** | **No horizontal scaling in v1** (per TA-6). | Architecture is single-instance compatible. Scaling out requires auth (for session-affinity story) and a read-replica strategy — both v2 concerns. |

### Decision Impact Analysis

**Implementation sequence (informs epic ordering, not part of this PRD pass):**

1. **Bootstrap epic:** scaffold repo per §Starter Template Evaluation (pnpm workspace, Vite client, Express server, shared package, docker-compose)
2. **Persistence epic:** Drizzle schema (D1.1), migrations (D1.3), `resolveOwner` middleware (D2.2), env validation (D5.3)
3. **API epic:** routes (D3.1), Zod validation (D1.2), error format (D3.3), pino logging (D5.4)
4. **Frontend epic:** TanStack Query hooks (D4.3), component tree (D4.1), optimistic UI (D4.5), Tailwind styling (FR-5), state components (FR-7/8/9)
5. **CI/security epic:** GitHub Actions (D5.2), helmet/CORS (D2.3), public-bind gate (D2.4)
6. **Quality gate epic:** chaos tests (NFR-7), Lighthouse CI (NFR-6), accessibility audit (NFR-5), bootstrap walkthrough (NFR-9)

**Cross-component dependencies:**
- D2.2 (`resolveOwner`) is a prerequisite for every API route
- D1.2 (Zod) types are shared between client (form validation) and server (request validation) — must land in `packages/shared` first
- D4.5 (optimistic UI) depends on D3.4 (stable API contract) and D3.2 (idempotency guarantees)
- D5.3 (env validation) blocks server boot — earliest fail point in any ops pipeline

## Implementation Patterns & Consistency Rules

These rules exist so that AI agents (or human developers) producing different stories cannot make incompatible choices.

### Naming Conventions

#### Database

| Item | Rule | Example |
|---|---|---|
| Tables | `snake_case`, plural | `todos` |
| Columns | `snake_case`, singular | `owner_id`, `created_at` |
| Indexes | `idx_<table>_<columns>` | `idx_todos_owner_created` |
| Foreign keys | `fk_<from_table>_<to_table>` (when added) | _(none in v1)_ |

#### API

| Item | Rule | Example |
|---|---|---|
| URL path | lowercase, plural resource, no trailing slash | `/api/todos`, `/api/todos/:id` |
| Path parameters | `:paramName` (Express style) | `/api/todos/:id` |
| Query parameters | `camelCase` | `?completedOnly=true` |
| JSON keys (request and response) | **`camelCase`** | `{ "ownerId": "anonymous", "createdAt": "..." }` |
| HTTP headers | Standard kebab-case-by-convention; custom headers prefixed `X-` only if necessary (none required v1) | _(none)_ |

#### Code

| Item | Rule | Example |
|---|---|---|
| React component files | `PascalCase.tsx` | `TodoItem.tsx` |
| Non-component TS files | `kebab-case.ts` | `resolve-owner.ts`, `todo-schema.ts` |
| Test files | `*.test.ts(x)`, co-located | `TodoItem.test.tsx` next to `TodoItem.tsx` |
| TS types and interfaces | `PascalCase` | `Todo`, `CreateTodoInput` |
| TS functions, methods, variables | `camelCase` | `createTodo`, `ownerId` |
| Module-level constants | `SCREAMING_SNAKE_CASE` (only for true constants like limits and flags) | `MAX_TITLE_LENGTH = 280` |
| React hooks | `useXxx` prefix, `camelCase` | `useTodos`, `useCreateTodo` |

#### Critical boundary rule

**Drizzle's column-name-to-property mapping converts `snake_case` (DB) ↔ `camelCase` (TS) at the persistence layer.** Above the persistence layer (services, routes, API JSON, client), every identifier is `camelCase`. Snake_case must never bleed into JSON or TS application code.

### Project Structure

```
todo-app/
├── apps/
│   ├── client/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── components/             # flat for v1; promote to feature folders past ~12 components
│   │   │   │   ├── TodoList.tsx
│   │   │   │   ├── TodoItem.tsx
│   │   │   │   ├── NewTodoInput.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── LoadingIndicator.tsx
│   │   │   │   └── ErrorBanner.tsx
│   │   │   ├── hooks/                  # TanStack Query wrappers + helpers
│   │   │   │   ├── use-todos.ts
│   │   │   │   ├── use-create-todo.ts
│   │   │   │   ├── use-update-todo.ts
│   │   │   │   └── use-delete-todo.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts       # fetch wrapper, error envelope parsing
│   │   │   │   └── perf.ts             # performance.mark wrappers
│   │   │   └── styles/
│   │   │       └── index.css           # Tailwind directives
│   │   └── (vite.config.ts, tsconfig.json, etc.)
│   └── server/
│       ├── src/
│       │   ├── index.ts                # process entry; calls bootstrap
│       │   ├── env.ts                  # Zod-validated env schema
│       │   ├── app.ts                  # express app factory (testable, no listen)
│       │   ├── routes/
│       │   │   ├── todos.ts            # /api/todos handlers
│       │   │   └── health.ts           # /api/health
│       │   ├── middleware/
│       │   │   ├── resolve-owner.ts    # sets req.owner (Decision 1)
│       │   │   ├── validate.ts         # Zod request validation factory
│       │   │   └── error-handler.ts    # centralizes thrown errors → HTTP
│       │   ├── db/
│       │   │   ├── schema.ts           # Drizzle schema definitions
│       │   │   ├── client.ts           # connection / pool
│       │   │   └── todos-repo.ts       # query functions (only place SQL lives)
│       │   └── lib/
│       │       └── logger.ts           # pino instance
│       └── (drizzle.config.ts, tsconfig.json, etc.)
└── packages/
    └── shared/
        └── src/
            ├── todo.ts                 # Todo type, Zod schemas
            ├── api.ts                  # request/response types
            └── index.ts                # barrel export
```

**Layout philosophy:**
- **Server:** by-layer (`routes/`, `middleware/`, `db/`, `lib/`). Fine for ≤10 endpoints; convert to by-feature if endpoint count outgrows.
- **Client:** flat `components/` for v1 (≤12 components). Convert to feature-folders past that threshold.

### Format Patterns

| Item | Rule |
|---|---|
| Dates in JSON | ISO 8601 strings (`"2026-04-29T13:30:00.000Z"`). Drizzle `timestamptz` columns return `Date` objects in TS — JSON serialization is automatic via default `JSON.stringify`. |
| Booleans | `true` / `false` only. Never `0/1`, never `"yes"/"no"`. |
| Empty arrays | `[]` (never `null`). `GET /api/todos` with no rows returns `[]`. |
| Optional fields in v1 | None — all `Todo` fields are required. If introduced later, default to "absent in request, `null` in response," picked per-field and held consistent. |
| Error responses | Always `{ "error": { "message": string, "code": string } }`. Codes are short stable strings (e.g., `TODO_NOT_FOUND`, `VALIDATION_FAILED`). |
| Success responses | **Direct payload, no wrapper.** `GET /api/todos` returns `Todo[]`; `POST /api/todos` returns `Todo`. |
| HTTP status codes | `200` for read success; `201` + `Location` header for create; `200` for update (with new state in body); `204` for delete (idempotent — even on missing ID per D3.2); `400` for validation error; `500` for unexpected. |

### Communication Patterns

| Topic | Rule |
|---|---|
| **Mutations (client)** | All mutations go through TanStack Query mutation hooks (`useCreateTodo`, `useUpdateTodo`, `useDeleteTodo`). **Direct `fetch()` calls in components are forbidden** — bypassing the hook layer silently breaks FR-10 (optimistic UI). |
| **Queries (client)** | All reads go through TanStack Query (`useTodos`). No raw `fetch()` from components. |
| **Database access (server)** | All SQL goes through `apps/server/src/db/todos-repo.ts`. Routes never construct queries inline. |
| **Input validation (server)** | Every endpoint validates request via Zod schema imported from `@shared`. Mandatory even if the client validates first (defense in depth). |
| **Form validation (client)** | Same Zod schema as server, applied at submission. Errors surface inline; do not block typing. |
| **React state updates** | Use functional setState (`setX(prev => …)`) when next state depends on previous state. No direct mutation. |
| **Event payloads** | N/A in v1 (no event bus). When introduced: `<resource>.<verb>` naming (`todo.created`), not `TodoCreated`. |

### Process Patterns

| Topic | Rule |
|---|---|
| **Server error handling** | Throw typed errors from repos/services; the `error-handler.ts` middleware translates them to HTTP responses. **Never call `res.status(...).json(...)` from services or repos** — only routes and middleware send responses. |
| **Client error handling** | TanStack Query `onError` callbacks set `ErrorBanner` state. **No `try`/`catch` in components.** |
| **Loading states** | Driven by TanStack Query's `isPending` / `isFetching`. **No manual `useState<boolean>` loading flags.** |
| **Server logging** | `pino` only via `logger.info`, `logger.error`, etc. **No `console.log` in `apps/server/src/`** — lint-enforced via `no-console`. |
| **Client logging** | `console.error` is the sole permitted console method, used by `api-client.ts` for surfaced errors. **No `console.log`.** |
| **Imports** | Path aliases only: `@app/*` (client), `@server/*` (server), `@shared/*` (shared package). **No relative imports beyond one level** — `./Foo` is fine, `../../../foo` is forbidden, lint-enforced. |
| **Async patterns** | `async`/`await` only. No `.then()` chains. No callbacks. Lint-enforced. |
| **Migrations** | Schema change workflow: edit `schema.ts` → `pnpm db:generate` → review generated SQL → commit both files. **Never edit a generated migration after it's been applied to any environment** — create a new migration instead. |

### Enforcement

**Lint-enforced** (ESLint flat config, wired into CI per D5.2):
- `no-console` (server: error only; client: error only via api-client)
- `no-restricted-imports` (no relative imports beyond one level; no direct imports between `apps/`)
- `no-restricted-syntax` (no `.then()` chains)
- `import/order` (consistent import grouping: external → `@shared` → `@app`/`@server` → relative)
- `@typescript-eslint/no-floating-promises` (catches missed `await`)
- Standard `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`

**TypeScript-enforced** (compile-time):
- Shared types between client and server (no drift possible)
- Zod schemas → inferred types (validation contract = type contract)
- Drizzle schema → inferred types (DB shape = TS shape)

**Convention-enforced** (PR review):
- JSON casing rules
- Mutation-via-hook rule
- Migration immutability
- File naming and project layout

### Examples

**Good — TanStack Query mutation with optimistic update (per D4.5):**

```typescript
// apps/client/src/hooks/use-create-todo.ts
export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => apiClient.post('/api/todos', input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']) ?? [];
      const optimistic: Todo = {
        id: crypto.randomUUID(),
        ownerId: 'anonymous',
        title: input.title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData(['todos'], [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx) queryClient.setQueryData(['todos'], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });
}
```

**Anti-pattern — bypasses the hook layer:**

```typescript
// ❌ FORBIDDEN — direct fetch in component breaks FR-10
function NewTodoInput() {
  const [title, setTitle] = useState('');
  const submit = async () => {
    await fetch('/api/todos', { method: 'POST', body: JSON.stringify({ title }) });
  };
  // ...
}
```

**Good — server route with thrown typed error:**

```typescript
// apps/server/src/routes/todos.ts
todosRouter.delete('/:id', async (req, res) => {
  await todosRepo.delete(req.owner, req.params.id);
  res.status(204).end();
});

// apps/server/src/db/todos-repo.ts
export async function delete(ownerId: string, id: string): Promise<void> {
  // No-op if missing — D3.2 idempotency.
  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.ownerId, ownerId)));
}
```

**Anti-pattern — repo sends HTTP response:**

```typescript
// ❌ FORBIDDEN — repos never send responses
export async function delete(req: Request, res: Response) {
  // ...
  res.status(204).end();  // wrong — only routes/middleware send responses
}
```

## Project Structure & Boundaries

### Complete Project Tree

```
todo-app/
├── README.md                              # Bootstrap instructions, R-2 deployment warning
├── package.json                           # Root scripts (dev, build, test, lint, db:*)
├── pnpm-workspace.yaml                    # Workspace config (apps/*, packages/*)
├── pnpm-lock.yaml
├── docker-compose.yml                     # Local Postgres 17 (NFR-9)
├── .env.example                           # All vars documented; BIND=127.0.0.1 default (D2.4)
├── .gitignore
├── .nvmrc                                 # Node 24 LTS
├── .editorconfig
├── eslint.config.js                       # Flat config, root-level
├── .prettierrc.json
├── tsconfig.base.json                     # Shared compiler options
├── .github/
│   └── workflows/
│       ├── ci.yml                         # lint + type-check + test + coverage (NFR-8)
│       ├── lighthouse.yml                 # NFR-6 LCP gate
│       └── playwright.yml                 # NFR-4 cross-browser matrix
├── apps/
│   ├── client/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts                 # Vite 8 + plugin-react v6 + Tailwind plugin
│   │   ├── index.html
│   │   ├── tailwind.config.ts             # FR-11 breakpoints
│   │   ├── postcss.config.js
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       ├── components/
│   │       │   ├── TodoList.tsx           # FR-2
│   │       │   ├── TodoItem.tsx           # FR-3, FR-4, FR-5
│   │       │   ├── NewTodoInput.tsx       # FR-1
│   │       │   ├── EmptyState.tsx         # FR-7
│   │       │   ├── LoadingIndicator.tsx   # FR-8
│   │       │   └── ErrorBanner.tsx        # FR-9
│   │       ├── hooks/
│   │       │   ├── use-todos.ts           # FR-2 query
│   │       │   ├── use-create-todo.ts     # FR-1 + FR-10
│   │       │   ├── use-update-todo.ts     # FR-3 + FR-10
│   │       │   └── use-delete-todo.ts     # FR-4 + FR-10
│   │       ├── lib/
│   │       │   ├── api-client.ts          # fetch wrapper, error envelope parsing
│   │       │   ├── perf.ts                # NFR-2 instrumentation
│   │       │   └── query-client.ts        # TanStack QueryClient instance
│   │       ├── styles/
│   │       │   └── index.css              # Tailwind directives
│   │       └── test/
│   │           ├── setup.ts               # Vitest setup, RTL config
│   │           └── e2e/                   # Playwright specs
│   │               ├── core-flow.spec.ts  # NFR-4 cross-browser
│   │               └── a11y.spec.ts       # NFR-5 axe-core integration
│   └── server/
│       ├── package.json
│       ├── tsconfig.json
│       ├── drizzle.config.ts
│       └── src/
│           ├── index.ts                   # entry; calls bootstrap()
│           ├── env.ts                     # Zod env schema (D5.3)
│           ├── app.ts                     # Express app factory (testable, no listen)
│           ├── routes/
│           │   ├── todos.ts               # FR-1, FR-2, FR-3, FR-4
│           │   └── health.ts
│           ├── middleware/
│           │   ├── resolve-owner.ts       # D2.2 (Decision 1 seam)
│           │   ├── validate.ts            # Zod request validation factory
│           │   ├── error-handler.ts       # D3.3 error envelope
│           │   └── public-bind-gate.ts    # D2.4 R-2 mitigation
│           ├── db/
│           │   ├── schema.ts              # FR-6, D1.1
│           │   ├── client.ts              # pg pool + Drizzle wiring
│           │   ├── todos-repo.ts          # all SQL for FR-1..6
│           │   └── migrations/            # generated by drizzle-kit
│           ├── lib/
│           │   └── logger.ts              # pino instance (D5.4)
│           └── test/
│               ├── setup.ts
│               ├── todos-repo.test.ts        # unit
│               ├── routes-todos.int.test.ts  # supertest integration
│               ├── chaos.test.ts             # NFR-7 error-surface chaos
│               └── persistence.int.test.ts   # NFR-3 restart durability
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts                   # barrel export
            ├── todo.ts                    # Todo type, Zod schemas
            └── api.ts                     # request/response types, ApiError type
```

### Architectural Boundaries

| Boundary | Definition | Enforcement |
|---|---|---|
| API surface | Single REST API at `/api/*`. Five endpoints (D3.1). No other public surface. | Route-level. Lint forbids defining handlers outside `apps/server/src/routes/`. |
| Identity boundary | `resolveOwner` middleware (Decision 1) is the only place identity is decided. Everywhere else trusts `req.owner`. | Single source. When auth lands, this is the one file that changes. |
| Data access boundary | All SQL contained in `apps/server/src/db/todos-repo.ts`. Routes never query directly. | Convention + code review. Repo is the only file importing from `db/client.ts`. |
| Shared contract boundary | `packages/shared/src/` is the single source for cross-process types and validation. Both `apps/client` and `apps/server` import from `@shared`. | TypeScript: workspace dep declared in both `apps/`. Importing `Todo` from anywhere else is a lint error. |
| Validation boundary | Same Zod schema runs on client (form) and server (request middleware). Server runs every request through Zod validation regardless of client validation. | `validate.ts` middleware factory. No route handler can be registered without a validator. |
| Public-bind boundary | Server refuses non-loopback bind unless `ALLOW_PUBLIC_BIND=true`. R-2 mitigation. | `public-bind-gate.ts` runs in `bootstrap()`; throws before `listen()` if violated. |

### Requirements → Structure Mapping

#### Functional Requirements

| FR | Locations |
|---|---|
| **FR-1** create | `apps/server/src/routes/todos.ts` (POST) + `apps/server/src/db/todos-repo.ts` (`create`) + `apps/client/src/components/NewTodoInput.tsx` + `apps/client/src/hooks/use-create-todo.ts` + `packages/shared/src/todo.ts` (`createTodoSchema`) |
| **FR-2** list | `apps/server/src/routes/todos.ts` (GET) + `apps/server/src/db/todos-repo.ts` (`list`) + `apps/client/src/hooks/use-todos.ts` + `apps/client/src/components/TodoList.tsx` |
| **FR-3** toggle | `apps/server/src/routes/todos.ts` (PATCH) + `apps/server/src/db/todos-repo.ts` (`update`) + `apps/client/src/hooks/use-update-todo.ts` + `apps/client/src/components/TodoItem.tsx` |
| **FR-4** delete | `apps/server/src/routes/todos.ts` (DELETE) + `apps/server/src/db/todos-repo.ts` (`delete`) + `apps/client/src/hooks/use-delete-todo.ts` + `apps/client/src/components/TodoItem.tsx` |
| **FR-5** visual distinction | `apps/client/src/components/TodoItem.tsx` (Tailwind utility classes; conditional opacity + line-through; ≥3:1 contrast) |
| **FR-6** persistence | `apps/server/src/db/schema.ts` + `apps/server/src/db/client.ts` + `apps/server/src/db/migrations/*` + `docker-compose.yml` (Postgres 17) |
| **FR-7** empty state | `apps/client/src/components/EmptyState.tsx` |
| **FR-8** loading state | `apps/client/src/components/LoadingIndicator.tsx` (driven by TanStack Query `isPending`) |
| **FR-9** error state | `apps/client/src/components/ErrorBanner.tsx` + `apps/client/src/lib/api-client.ts` (parses error envelope) + `apps/server/src/middleware/error-handler.ts` (produces error envelope) |
| **FR-10** optimistic UI | All `apps/client/src/hooks/use-*-todo.ts` (TanStack Query `onMutate` / `onError` / `onSettled` per D4.5) |
| **FR-11** responsive layout | `apps/client/tailwind.config.ts` (320–1920px breakpoints) + all components (Tailwind responsive utilities) |
| **FR-12** keyboard operability | All interactive components (`<button>`, `<input>` with proper `onKeyDown` and visible focus) + `apps/client/src/test/e2e/a11y.spec.ts` |

#### Non-Functional Requirements

| NFR | Locations |
|---|---|
| **NFR-1** API p95 <200ms | `apps/server/src/lib/logger.ts` + `pino-http` middleware in `app.ts` (logs `request_duration_ms`) |
| **NFR-2** UI 150ms median | `apps/client/src/lib/perf.ts` (Performance API marks around mutations) |
| **NFR-3** durability across restart | `apps/server/src/db/*` + `apps/server/src/test/persistence.int.test.ts` |
| **NFR-4** browser support | `apps/client/src/test/e2e/*` + `.github/workflows/playwright.yml` |
| **NFR-5** WCAG 2.1 AA | All client components + `apps/client/src/test/e2e/a11y.spec.ts` (axe-core) + `.github/workflows/ci.yml` |
| **NFR-6** LCP <2s on Fast 3G | Default Vite output + `.github/workflows/lighthouse.yml` (Lighthouse CI gate) |
| **NFR-7** error visible <1s | `apps/server/src/test/chaos.test.ts` + `apps/client/src/lib/api-client.ts` (timeout config) |
| **NFR-8** lint + types + ≥80% coverage | Root `eslint.config.js` + `tsconfig.base.json` + `.github/workflows/ci.yml` |
| **NFR-9** clean clone → running app <10 min | `README.md` + `package.json` root scripts + `docker-compose.yml` |

#### Cross-Cutting Concerns

| Concern | Location |
|---|---|
| Owner resolution (Decision 1) | `apps/server/src/middleware/resolve-owner.ts` |
| Shared types | `packages/shared/src/todo.ts` |
| Error envelope contract | `packages/shared/src/api.ts` (`ApiError`) + server error-handler + client api-client |
| Env validation | `apps/server/src/env.ts` |
| Logger (server) | `apps/server/src/lib/logger.ts` |
| Public-bind safety gate | `apps/server/src/middleware/public-bind-gate.ts` |
| Performance instrumentation | `apps/server/src/lib/logger.ts` (server) + `apps/client/src/lib/perf.ts` (client) |

### Integration Points & Data Flow

#### Mutation path (e.g., FR-1 create)

```
User keystroke + submit
  → NewTodoInput component (React state)
  → useCreateTodo() hook                    (TanStack Query mutation)
  → onMutate: optimistic cache update       (FR-10)
  → api-client.post('/api/todos', input)    (fetch wrapper)
  → ───── HTTP ─────
  → Express request
  → resolveOwner middleware                 (sets req.owner = 'anonymous')
  → validate middleware                     (Zod createTodoSchema)
  → todos route POST handler
  → todosRepo.create(req.owner, input)
  → Drizzle insert
  → Postgres
  → ───── reverse path ─────
  → JSON response { id, ownerId, title, completed, createdAt, updatedAt }
  → fetch resolves
  → onSettled: invalidate ['todos'] query   (triggers reconcile refetch)
  → React re-render with confirmed state
```

**Query path (FR-2 list):** identical except read-only — no `onMutate`, just `useQuery` → cache → render.

**Error path:** any layer throws → server's `error-handler.ts` catches → translates to `{ error: { message, code } }` JSON + appropriate HTTP status → client `api-client.ts` parses envelope and re-throws → TanStack Query `onError` → `ErrorBanner` state set → rollback (mutations) via `onError` previous-snapshot restore.

#### External integrations

**None in v1.** No third-party APIs, email service, analytics, payments, or auth provider. Architecture is fully self-contained: client + server + Postgres.

### Development Workflow Integration

| Workflow | Structure support |
|---|---|
| Dev startup (`pnpm dev`) | Root script runs `docker-compose up -d` (Postgres) + `pnpm --filter ... dev` for client and server in parallel. Single command for NFR-9. |
| Build (`pnpm build`) | Per-app `pnpm --filter` build; client → `apps/client/dist/` (static); server → `apps/server/dist/` (compiled JS). |
| Test (`pnpm test`) | Vitest in both apps + Playwright in `apps/client/src/test/e2e/`. Coverage reported per package and aggregated. |
| Lint (`pnpm lint`) | Root ESLint flat config across `apps/*/src/**` and `packages/*/src/**`. |
| Type-check (`pnpm typecheck`) | `tsc --noEmit` per package using `tsconfig.base.json` extension. |
| DB migrations (`pnpm db:generate`, `pnpm db:migrate`) | Root scripts proxy to `apps/server` Drizzle Kit commands. |
| CI | `.github/workflows/ci.yml` runs lint + typecheck + test + coverage on every PR. Lighthouse and Playwright in separate workflows. |
| Deploy (future) | Server image Dockerfile in `apps/server/`. Static client deployed separately or served by Express. **Deferred — D5.1.** |

## Architecture Validation Results

### Coherence Validation ✅

| Check | Status | Notes |
|---|---|---|
| Tech stack compatibility | ✓ | React 19 + Vite 8 + plugin-react v6 (Oxc) all current; Express 5 + Drizzle 0.45 + pg compatible; TypeScript 6 supported across all toolchains |
| Pattern ↔ decision alignment | ✓ | Optimistic UI (D4.5) relies on idempotency (D3.2); `resolveOwner` middleware (D2.2) consumes `owner_id` column (D1.1); shared Zod schemas (D1.2) imported by both client and server |
| Structure ↔ decision alignment | ✓ | `packages/shared` supports the contract boundary (D3.4); `db/todos-repo.ts` isolation supports owner-scoping (D2.2); public-bind gate file (D2.4) lives in middleware |
| No contradictory decisions | ✓ | TA-5 resolved; D4.3 (TanStack Query) + D4.5 (optimistic UI) mutually reinforcing; D5.4 (pino) + NFR-1 instrumentation align |

### Requirements Coverage Validation ✅

- **Functional Requirements:** 12 / 12 covered with explicit implementation locations (see §Project Structure → Requirements Mapping). No orphans.
- **Non-Functional Requirements:** 9 / 9 covered, each with measurement implementation or CI workflow gate. No orphans.

#### PRD Open Items inherited at start

| Item | Resolution |
|---|---|
| TA-5 / R-1 (persistence scoping) | ✅ Resolved by stakeholder + Decision 1 (auth-ready seam) |
| SC-3 (latency target deployment context) | ⚠️ **Partially addressed** — NFR-1/NFR-2 measured against localhost in v1 (matches PRD's stated target). Production target undefined (D5.1 deferred). Not blocking v1. |
| R-2 (no-auth + public URL footgun) | ✅ Resolved by D2.4 (`ALLOW_PUBLIC_BIND` gate + `BIND=127.0.0.1` default + README warning) |

#### Risk Coverage

| PRD Risk | Architecture Response |
|---|---|
| R-1 | Resolved (Decision 1) |
| R-2 | Resolved (D2.4) |
| R-3 (280-char title cap is opinionated) | Codified as `MAX_TITLE_LENGTH` constant in `packages/shared/src/todo.ts`; revisit by changing one constant |
| R-4 (optimistic UI rollback edge cases) | Addressed by D4.5 (canonical TanStack Query rollback) + NFR-7 chaos test in `apps/server/src/test/chaos.test.ts` |

### Implementation Readiness Validation ✅

| Check | Status |
|---|---|
| Decisions documented with versions | ✓ Version pins in §Starter Template Evaluation; lint/CI gates pin runtime |
| Patterns enforceable | ✓ Lint rules + convention rules listed in §Implementation Patterns → Enforcement |
| Examples provided | ✓ Good and anti-pattern code examples for TanStack Query mutations and route/repo separation |
| Structure complete to file level | ✓ Project tree includes every file with FR/NFR mapping |
| Integration points mapped | ✓ Mutation path, query path, error path documented; data flow diagram included |

### Gap Analysis

#### Critical gaps
**None.**

#### Important gaps (addressable during implementation; not blocking architecture)

| Gap | Impact | Resolution |
|---|---|---|
| No test coverage planned for `public-bind-gate.ts` | D2.4 safety gate is single point of failure for R-2; bug in the gate makes the protection illusory | Add `apps/server/src/test/public-bind-gate.test.ts`; bootstrap story acceptance includes this |
| TSConfig path aliases not yet pinned (`@app/*`, `@server/*`, `@shared/*`) | All imports per §Implementation Patterns rely on these aliases | Bootstrap story acceptance: `tsconfig.base.json` defines shared paths; per-package configs extend |
| Tailwind exact breakpoints not pinned (FR-11 requires 320–1920px range) | Default Tailwind covers comfortably but isn't documented as the explicit choice | Bootstrap story: `tailwind.config.ts` uses Tailwind defaults (`sm:640px` … `2xl:1536px` covers FR-11 cleanly) |

#### Nice-to-have (post-MVP)

- Storybook for component development (not needed at 6-component scope)
- MSW for client dev when backend is down
- Pre-commit hooks (Husky + lint-staged)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low complexity, full-stack web)
- [x] Technical constraints identified (TA-1..7)
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed (NFR-1, NFR-2, NFR-6)

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented (error handling, logging, imports, async)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete (12/12 FR + 9/9 NFR)

**16 / 16 checked.** No Critical Gaps. 3 Important gaps (all addressable during implementation).

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION**

**Confidence Level:** **High** — small project, clean stack constraints, all decisions traceable, coherent throughout.

**Key Strengths:**
- Clean separation of concerns: identity (one middleware), data access (one repo), validation (one schema package), errors (one envelope contract)
- Future-auth seam designed in v1 (Decision 1) — auth lands as a one-file change
- R-2 footgun mitigated with both default-safe config and runtime gate
- Every FR and NFR has a documented implementation location
- Tech stack is "boring" by design — no exotic libraries, all 2026-current versions
- TypeScript end-to-end + Drizzle + Zod = three reinforcing sources of type-safety (DB schema, validation schema, code types)

**Areas for Future Enhancement:**
- Production deployment target (D5.1) when one materializes
- Caching layer (D1.4) if NFR-1 numbers ever fail under real load
- Rate limiting once auth lands and identities exist
- Horizontal scaling (D5.6) if traffic ever justifies it

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns consistently — bypassing them (e.g., direct `fetch()` from components) silently breaks FRs (notably FR-10)
- Respect project structure and boundaries — repos never send HTTP responses; routes never construct SQL inline
- The first implementation story is **bootstrap** — scaffolds the monorepo per §Starter Template Evaluation init sketch
- Refer to `## Implementation Patterns & Consistency Rules` for any unclear naming or process question

**First Implementation Priority — Bootstrap Story acceptance criteria:**

```bash
# Clean clone → `pnpm install && pnpm dev` → running app within 10 minutes (NFR-9)

# 1. Scaffold workspace
pnpm init                              # root package.json
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# 2. Frontend
pnpm create vite@latest apps/client -- --template react-ts

# 3. Backend (manual scaffold; no canonical CLI for Express + TS)
mkdir -p apps/server && cd apps/server
pnpm init
pnpm add express drizzle-orm pg pino pino-http helmet cors zod
pnpm add -D @types/express @types/pg drizzle-kit tsx vitest typescript pino-pretty

# 4. Shared types
mkdir -p packages/shared/src && cd packages/shared
pnpm init

# 5. docker-compose.yml for Postgres 17
# 6. .env.example with BIND=127.0.0.1 and ALLOW_PUBLIC_BIND=false
# 7. tsconfig.base.json with @app/*, @server/*, @shared/* paths
# 8. ESLint flat config + Prettier
# 9. Root scripts (dev, build, test, lint, typecheck, db:generate, db:migrate)
# 10. README with R-2 deployment warning
# 11. public-bind-gate.test.ts (covers Important gap from validation)
```

