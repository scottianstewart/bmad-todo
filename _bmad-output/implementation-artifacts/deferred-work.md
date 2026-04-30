# Deferred Work

A running ledger of items intentionally skipped during a story, with rationale and a pointer to where the fix should land. Reviewed at the end of each epic — stale items are marked resolved and removed; live items roll forward.

---

## Resolved during 2026-04-30 deferred-work pass

These items were either fixed in a later story or rendered moot by the implementation that landed. Kept here as a paper trail; safe to remove on the next pass if no one needs the history.

- ✅ **`@typescript-eslint/no-floating-promises` not type-aware** (deferred from 1.1) — fixed in 1.2 via `parserOptions.projectService: true` scoped to `apps/**/src/**` and `packages/**/src/**`.
- ✅ **`import-x/order` missing `pathGroups` for `@app/*`** (deferred from 1.2) — fixed in 2.1 via `pathGroups` for `@app/**`, `@server/**`, `@shared/**`, `@todo-app/**`.
- ✅ **No Express error-handler middleware** (deferred from 1.3) — fixed in 2.2.
- ✅ **`express.json()` no explicit body-size limit** (deferred from 1.3) — fixed in 2.2 (`limit: '8kb'` with explicit 413 on overflow).
- ✅ **`cors()` wildcard origin** (deferred from 1.3) — fixed in 2.2 (function-based allowlist driven by `CORS_ORIGIN` env var).
- ✅ **`z.string().datetime()` vs Drizzle `Date` mismatch** (deferred from 1.4) — fixed in 1.6 via the `rowToTodo` mapper that calls `.toISOString()` on the timestamp columns.
- ✅ **`apiErrorSchema` missing `statusCode`** (deferred from 1.4) — moot: Story 2.1's `ApiClientError` carries the HTTP status as a separate field on the thrown class. Duplicating it inside the envelope schema would be redundant and bloats the contract.
- ✅ **No `ApiSuccess<T>` / `ApiResponse<T>` union** (deferred from 1.4) — moot: api-client helpers are generic in `T` and return the parsed body directly. A wrapper union would force callers to discriminate when the throw-on-error path already does that.
- ✅ **`LOG_LEVEL` env var ignored by pino** (deferred from 1.3 addendum) — fixed 2026-04-30: `apps/server/src/lib/logger.ts` now reads `process.env.LOG_LEVEL` (default `'info'`).
- ✅ **`resolveOwner` unconditionally overwrites `req.owner`** (deferred from 1.3 addendum) — fixed 2026-04-30: `req.owner ??= 'anonymous'` preserves any pre-existing identity. Test added.
- ✅ **`DATABASE_URL` hardcoded default in production** (deferred from 1.3 addendum) — fixed 2026-04-30: `parseEnv` now requires `DATABASE_URL` when `NODE_ENV === 'production'` and only falls back to the dev default in `development`/`test`. Tests cover both paths.
- ✅ **No graceful shutdown handler** (deferred from 1.3 addendum) — fixed 2026-04-30: `apps/server/src/index.ts` now registers `SIGTERM` and `SIGINT` handlers that call `server.close(...)` and exit cleanly, with a 10s hard cap so a stuck connection can't block shutdown forever.
- ✅ **api-client tests don't assert outgoing request shape** (deferred from 2.1) — fixed 2026-04-30: added 4 cases asserting method + body + headers for `get` / `post` / `patch` / `del`.

---

## Live deferred items

### From 1.1
- **`.vscode/` excluded from `.gitignore`** — shared workspace config (extensions.json, recommended settings) is not committed. Low-priority for solo work; revisit if collaboration starts.

### From 1.2
- **`vitest.config.ts` `globals: true` without `"types": ["vitest/globals"]` in tsconfig** — currently fine because tests import from `'vitest'` explicitly. Add the type declaration if any test starts using implicit globals.

### From 1.3
- **`moduleResolution: "NodeNext"` for server tsconfig** — attempted in 1.3, reverted due to `pino-http@11` CJS interop failure and `@types/express@5` TS2883 errors on exported types. Revisit when those packages publish ESM-friendly versions; until then `moduleResolution: "Bundler"` (inherited from `tsconfig.base.json`) keeps things working.
- **Health test supertest open handle** — test creates a `createApp()` instance and never explicitly closes it. No real handle leak today (supertest doesn't bind a port for this pattern), but worth an `afterAll(() => server.close())` if the suite ever switches to long-lived listeners.

### From 1.4
- **`packages/shared/package.json` exports point to raw TS source** — `./src/index.ts` is the `default` export condition. Fine for the current monorepo (Vite + tsx + Vitest all resolve TS source directly), but `node dist/index.js` after a server `tsc -b` would crash since Node can't execute `.ts` natively. Fix before any production deploy that doesn't bundle the server: add `build` script, emit to `dist/`, update exports.
- **`composite: true` missing from `packages/shared/tsconfig.json`** — blocked by the dist-output gap above. Required for `tsc -b` project references.

### From 2.1
- **Architectural deviation: `@shared/*` path alias not wired through build tooling** — architecture mandates `@shared/*`, but Story 1.4 wired `@todo-app/shared` (workspace package name) instead, and Story 2.1's `api-client.ts` imports use the package name to match. Functionally equivalent (same files, same resolution); architecturally a mismatch with the documented convention. Full alignment requires composite emit + declaration emit + project references + matching `resolve.alias` entries. Pragmatic call: defer to a future architectural-alignment pass.
- **No fetch timeout / `AbortController` in `apiClient`** — hung connections will block UI and exhaust the React Query retry budget without surfacing as `NETWORK_ERROR`. Story 2.1 spec explicitly defers timeout to Story 3.5 (chaos test, NFR-7's "1s timeout" surface). Story 3.5's dev should add an `AbortController`-based timeout to `request<T>()` and a corresponding `code: 'TIMEOUT'` ApiClientError path.
- **Vite proxy hardcodes `http://localhost:3001`** — no env override. Acceptable for v1 single-port dev; future enhancement reads from `process.env.API_URL` (or a dotenv-vite plugin) with the literal as fallback.
- **`perf.ts` concurrency: same-name marks overwrite each other** — `markStart('todo.create')` followed by another `markStart('todo.create')` before `markEnd` overwrites the start. v1 is single-user with sequential mutations; concurrent same-name marks aren't expected. Future enhancement scopes marks by a generated id.

### From visual pass 2026-04-30
- **Postgres host port 5432 collision** — discovered when the visual pass server was hitting a host-installed Postgres at `localhost:5432` instead of the docker container. Remapped docker-compose to `5433:5432` and propagated through `.env.example`, `env.ts` default, `drizzle.config.ts`, `env.test.ts`. Bootstrap walkthrough acceptance (Story 3.7) should call out this collision in the README so future devs don't get bitten when they `pnpm db:up` on a machine with host Postgres.
- **`pnpm db:migrate` (drizzle-kit) silently fails with `[⣷] applying migrations...undefined`** — drizzle-kit's CLI swallows errors when it can't connect or the DB is in an unexpected state. Workaround used during visual pass: `docker exec -i todo-app-postgres psql -U todo -d todo < migration.sql`. Worth adding to README troubleshooting and tracking upstream — drizzle-kit#6453 / similar issues exist in their tracker. Story 3.7 scope (bootstrap acceptance).
