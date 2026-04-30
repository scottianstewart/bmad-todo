# Deferred Work

## Deferred from: code review of 1-1-bootstrap-monorepo-workspace-structure (2026-04-29)

- **`@typescript-eslint/no-floating-promises` not type-aware** — `parserOptions.project` is omitted from `eslint.config.js`; rule is inert until wired. Deferred to story 1.3 (story 1.2 already underway). Story 1.3 dev MUST add `parserOptions.project` to the ESLint config for this rule to actually enforce no-floating-promises.

- **Path alias targets don't exist yet** — `tsconfig.base.json` paths point to `./apps/client/src/*`, `./apps/server/src/*`, `./packages/shared/src/*` which don't exist. Correct by design; will be created in stories 1.2/1.3/1.4.
## Deferred from: code review of 1-2-scaffold-vite-react-typescript-frontend-skeleton (2026-04-29)

- **`import-x/order` missing `pathGroups` for `@app/*`** — imports using `@app/` will be classified as `external` by ESLint's import ordering rule. Add a `pathGroups` entry mapping `@app/**` to `internal` in the `import-x/order` rule config (story 2.x when first `@app/` imports are used).
- **`vitest.config.ts` `globals: true` without vitest type declarations** — tests currently import explicitly from `'vitest'` so no issue now. If test files use implicit globals, add `"types": ["vitest/globals"]` (or equivalent) to the test tsconfig. Low priority.

## Deferred from: code review of 1-3-scaffold-express-typescript-backend-skeleton (2026-04-29)

- **`moduleResolution: "NodeNext"` for server tsconfig** — attempted, reverted due to `pino-http@11` CJS interop failure. Server should override to `NodeNext` once `@types/express@5` and `pino-http` resolve their Node ESM compatibility issues. `composite: true` also blocked by `@types/express@5` TS2883 errors on exported types.

## Deferred from: code review of 1-3-scaffold-express-typescript-backend-skeleton (2026-04-29) — addendum

- **`cors()` wildcard origin** — no origin allowlist; acceptable for personal app with no auth yet. Revisit when auth / known client origin added (story 1.7+).
- **`LOG_LEVEL` env var ignored by pino** — `parseEnv()` validates `LOG_LEVEL` but `logger.ts` never reads it. Fix belongs in story 1.7 alongside the full env wiring.
- **No Express error-handler middleware** — explicitly deferred to story 2.2 per Dev Notes.
- **No graceful shutdown handler** — `SIGTERM`/`SIGINT` not handled; in-flight requests killed on container scale-down. Address in a future ops story.
- **`express.json()` no explicit body-size limit** — relies on Express 5 implicit 100 kB default; set explicitly when API routes are added.
- **`resolveOwner` unconditionally overwrites `req.owner`** — will silently clobber any future auth-derived identity placed before it in the middleware chain. Fix: `req.owner = req.owner ?? 'anonymous'`. Story 1.7 scope.
- **`DATABASE_URL` hardcoded default credential** — `postgresql://todo:todo@localhost:5432/todo` in `env.ts` default; missing var in prod silently falls through. Story 1.7 scope.
- **Health test supertest open handle** — `createApp()` instance in the health test is never explicitly closed; accumulates open handles as suite grows. Add `afterAll(server.close)` pattern when suite expands.

## Deferred from: code review of 1-4-shared-types-package-with-todo-and-apierror-contracts (2026-04-29)

- **`package.json` exports point to raw TS source** — `./src/index.ts` is the `default` export condition; `node dist/index.js` after server `tsc -b` would crash because Node.js can't execute `.ts` files natively. By design for current monorepo (Vite + tsx consumers). Fix before first production deployment: add `build` script, emit to `dist/`, update exports. Prerequisite for `composite: true` below.

- **`composite: true` missing from `packages/shared/tsconfig.json`** — shared package can't be a proper `tsc -b` project reference without `composite: true` + `declaration: true`. Blocked by the dist-output gap above. Fix alongside production build story.

- **`z.string().datetime()` timestamps incompatible with Drizzle `Date` objects** — Drizzle returns `Date` instances; `todoSchema` requires ISO strings. Every DB row passed through `todoSchema.parse()` will throw at runtime. Fix in story 1.5/1.6: change to `z.coerce.date()` or add a DB→wire mapping layer.

- **`apiErrorSchema` missing `statusCode` field** — clients must inspect HTTP status separately and cannot branch solely on the parsed error object. Fix in story 2.1 when the API client is built.

- **No `ApiSuccess<T>` / `ApiResponse<T>` union** — explicitly out of scope for story 1.4 ("No request/response wrapper types"). Define in story 2.1.

---

## Deferred from: code review of 1-1-bootstrap-monorepo-workspace-structure (2026-04-29)

- **`.vscode/` excluded from `.gitignore`** — shared workspace config (extensions.json, recommended settings) is not committed to the repo. Low-priority for a solo project; revisit if team collaboration is introduced.
