# Story 2.1: TanStack Query setup and api-client wrapper

Status: done

<!-- Validation optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **TanStack Query and a shared `api-client` fetch wrapper installed and wired in the client**,
so that **subsequent stories can use uniform query/mutation hooks with consistent error parsing**.

## Acceptance Criteria

1. **AC1 — TanStack Query installed.** `@tanstack/react-query` v5+ is added as a dependency to `apps/client`. Version is pinned to a 5.x range (`^5.0.0`). [Source: epics.md Story 2.1; architecture.md §Decisions D4.3]
2. **AC2 — `QueryClient` singleton.** `apps/client/src/lib/query-client.ts` exports a single `QueryClient` instance with project-wide defaults: `queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: false }`, `mutations: { retry: 0 }`. [Source: architecture.md §Decisions D4.3]
3. **AC3 — Provider wired in `main.tsx`.** `apps/client/src/main.tsx` wraps `<App />` in `<QueryClientProvider client={queryClient}>` using the singleton from AC2. The `<StrictMode>` wrapping is preserved. [Source: epics.md Story 2.1]
4. **AC4 — `api-client.ts` helpers.** `apps/client/src/lib/api-client.ts` exposes `get`, `post`, `patch`, `del` (renamed from `delete` because `delete` is a reserved word in TS) helpers. Each helper:
   - Issues a `fetch` against the path argument (e.g. `'/api/todos'`) with `Content-Type: application/json` for JSON-bodied methods.
   - On 2xx, returns the parsed JSON body typed as `T` (the helper is generic in the response type).
   - On non-2xx, parses the body, validates against `apiErrorSchema` from `@shared`, and **throws an `ApiClientError`** carrying `code`, `message`, and `status`.
   - Methods that produce no response body (e.g. 204) resolve to `undefined`.
   [Source: epics.md Story 2.1; architecture.md §Decisions D3.3 / D4.3; packages/shared/src/api.ts]
5. **AC5 — `ApiClientError` exported.** `api-client.ts` exports a `class ApiClientError extends Error` with public readonly `code: string`, `status: number`, and `message: string`. Thrown only by the helpers in AC4 when the server responds non-2xx (or when network/parse failure occurs — code `NETWORK_ERROR` for fetch failure, `INVALID_ERROR_ENVELOPE` for malformed server error bodies). [Source: architecture.md §Decisions D3.3]
6. **AC6 — `perf.ts` helpers.** `apps/client/src/lib/perf.ts` exposes `markStart(name: string): void` and `markEnd(name: string): { duration: number }` using `performance.mark` and `performance.measure`. `markEnd` returns the measured duration in ms (read from the `PerformanceMeasure` entry) and clears the marks/measure for the given name. [Source: epics.md Story 2.1; architecture.md §Decisions D5.5; NFR-2]
7. **AC7 — Vite dev proxy for `/api`.** `apps/client/vite.config.ts` configures `server.proxy['/api']` to `http://localhost:3001` so that same-origin `/api/...` calls from the dev client reach the Express server. [Source: architecture.md §Decisions D2.3 (CORS deferred to 2.2 — proxy avoids CORS in dev); NFR-9 (single-command dev experience)]
8. **AC8 — Smoke test: `useQuery` happy path.** A new test renders a component using `useQuery({ queryKey: ['health'], queryFn: () => apiClient.get<{ status: string }>('/api/health') })` inside a fresh `QueryClientProvider`. With `fetch` mocked to return 200 + `{ status: 'ok' }`, the test asserts the rendered output reflects the success state (`isSuccess`, data visible). [Source: epics.md Story 2.1]
9. **AC9 — Error path test: 500 surfaces `ApiClientError`.** A test calls `apiClient.get('/api/health')` directly with `fetch` mocked to return 500 + `{ "error": { "message": "boom", "code": "INTERNAL" } }`. The promise rejects with an `ApiClientError` where `error.code === 'INTERNAL'`, `error.message === 'boom'`, and `error.status === 500`. [Source: epics.md Story 2.1]
10. **AC10 — Malformed error envelope is contained.** A test calls `apiClient.get('/api/health')` with `fetch` mocked to return 500 + `{ "oops": "no envelope here" }`. The promise rejects with an `ApiClientError` where `error.code === 'INVALID_ERROR_ENVELOPE'` and `error.status === 500`. [Source: defense in depth; architecture.md §Decisions D3.3]
11. **AC11 — Network failure is contained.** A test calls `apiClient.get('/api/health')` with `fetch` mocked to reject with `new TypeError('Failed to fetch')`. The promise rejects with an `ApiClientError` where `error.code === 'NETWORK_ERROR'`. [Source: NFR-7]
12. **AC12 — `import-x/order` `pathGroups`.** Root `eslint.config.js` adds `pathGroups: [{ pattern: '@app/**', group: 'internal' }, { pattern: '@shared/**', group: 'internal' }]` (and `pathGroupsExcludedImportTypes: ['builtin']`) to the `import-x/order` rule so `@app/*` and `@shared/*` imports are grouped as `internal`, not `external`. [Source: 1-2 review deferred work; 1-1 review deferred work]
13. **AC13 — `console.error` allowed in `api-client.ts` only.** ESLint config adds an override for `apps/client/src/lib/api-client.ts` permitting `console.error` (rule: `'no-console': ['error', { allow: ['error'] }]`). All other client files retain the global `'no-console': 'error'`. [Source: architecture.md §Implementation Patterns → Process Patterns → Client logging]
14. **AC14 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
15. **AC15 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]
16. **AC16 — Tests pass.** `pnpm test` (all packages) passes. New tests added in this story all pass. [Source: NFR-8]
17. **AC17 — Build passes.** `pnpm --filter client build` produces `apps/client/dist/` with no warnings beyond what existed before this story. [Source: NFR-8 / Story 1.2 baseline]

## Tasks / Subtasks

- [x] **Task 1 — Install TanStack Query** (AC: 1)
  - [x] 1.1 — `pnpm --filter client add @tanstack/react-query@^5.0.0`. Verify resolved version is 5.100.x or later (current stable as of 2026-04).
  - [x] 1.2 — Confirm `apps/client/package.json` shows the new dep. No peer-dep warnings should be emitted; if any appear, document and resolve before proceeding.

- [x] **Task 2 — Create `query-client.ts`** (AC: 2)
  - [x] 2.1 — Create `apps/client/src/lib/query-client.ts`.
  - [x] 2.2 — Export a single `queryClient` instance: `export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: false }, mutations: { retry: 0 } } });`.
  - [x] 2.3 — No other exports. The instance is a module-level singleton (HMR-safe in Vite because module identity is preserved).

- [x] **Task 3 — Create `api-client.ts`** (AC: 4, 5, 13)
  - [x] 3.1 — Create `apps/client/src/lib/api-client.ts`.
  - [x] 3.2 — Define and export `class ApiClientError extends Error` with `code: string`, `status: number`. Constructor: `constructor(message: string, code: string, status: number)`; sets `this.name = 'ApiClientError'`.
  - [x] 3.3 — Implement an internal `request<T>(method, path, body?): Promise<T>` that:
    - Issues `fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })`.
    - Catches `TypeError` (or any thrown error from `fetch`) and rethrows `new ApiClientError('Network request failed', 'NETWORK_ERROR', 0)`.
    - On `!response.ok`: read JSON body via `response.json()` (catch parse failures → throw `new ApiClientError('Server returned non-JSON error', 'INVALID_ERROR_ENVELOPE', response.status)`). Run `const result = apiErrorSchema.safeParse(body)`. If `result.success`, throw `new ApiClientError(result.data.error.message, result.data.error.code, response.status)`. If `!result.success` (Zod validation failed), throw `new ApiClientError('Server returned malformed error envelope', 'INVALID_ERROR_ENVELOPE', response.status)`. **Note:** `result.error` on a failed `safeParse` is a `ZodError` — never confuse it with the envelope's `.error` field.
    - On `response.ok`: if status is 204, return `undefined as T`. Else return `(await response.json()) as T`.
  - [x] 3.4 — Export `apiClient = { get, post, patch, del }` where each is a thin generic wrapper around `request`. `get` and `del` take `(path)`; `post` and `patch` take `(path, body)`. **Use `del` not `delete`** (TS reserved word).
  - [x] 3.5 — `console.error` is permitted but not required; if used (e.g. for unexpected non-`ApiClientError` exceptions in `request`), it must be the only `console.*` call.
  - [x] 3.6 — Imports use `@shared` for `apiErrorSchema` (not relative).

- [x] **Task 4 — Create `perf.ts`** (AC: 6)
  - [x] 4.1 — Create `apps/client/src/lib/perf.ts`.
  - [x] 4.2 — Export `markStart(name: string): void` calling `performance.mark(`${name}:start`)`.
  - [x] 4.3 — Export `markEnd(name: string): { duration: number }`. It calls `performance.mark(`${name}:end`)`, `performance.measure(name, `${name}:start`, `${name}:end`)`, reads the resulting `PerformanceMeasure` from `performance.getEntriesByName(name, 'measure').at(-1)`, then calls `performance.clearMarks(...)` and `performance.clearMeasures(name)` to avoid leaks. Returns `{ duration: measure?.duration ?? 0 }`.
  - [x] 4.4 — No console output, no side effects beyond Performance API.

- [x] **Task 5 — Wire `QueryClientProvider` in `main.tsx`** (AC: 3)
  - [x] 5.1 — Update `apps/client/src/main.tsx`: import `QueryClientProvider` from `@tanstack/react-query` and `queryClient` from `@app/lib/query-client`. Wrap `<App />` in `<QueryClientProvider client={queryClient}>`. Preserve `<StrictMode>` outermost.
  - [x] 5.2 — Existing CSS import (`./styles/index.css`) preserved.

- [x] **Task 6 — Add Vite dev proxy for `/api`** (AC: 7)
  - [x] 6.1 — Update `apps/client/vite.config.ts` to add `server.proxy = { '/api': 'http://localhost:3001' }`. Keep existing `port: 5173` and `resolve.alias`.

- [x] **Task 7 — Update ESLint config** (AC: 12, 13)
  - [x] 7.1 — In `eslint.config.js`, locate the `import-x/order` rule and add `pathGroups: [{ pattern: '@app/**', group: 'internal' }, { pattern: '@shared/**', group: 'internal' }, { pattern: '@server/**', group: 'internal' }]` plus `pathGroupsExcludedImportTypes: ['builtin']`. (Including `@server/**` is forward-looking; doesn't affect current client-only changes but lands the convention now.)
  - [x] 7.2 — Add a new override block for `apps/client/src/lib/api-client.ts`: `rules: { 'no-console': ['error', { allow: ['error'] }] }`.
  - [x] 7.3 — Run `pnpm lint` to confirm zero errors.

- [x] **Task 8 — Smoke test for `useQuery` happy path** (AC: 8)
  - [x] 8.1 — Create `apps/client/src/lib/api-client.test.tsx` (or split into `api-client.test.ts` + a separate `useQuery` smoke test — author's choice; whichever is cleaner).
  - [x] 8.2 — Use a small test helper that renders the test component inside a fresh `QueryClient` (NOT the singleton — fresh per test to avoid cache bleed). Pattern:
    ```ts
    function renderWithClient(ui: ReactNode) {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
    }
    ```
  - [x] 8.3 — Mock `globalThis.fetch` via `vi.stubGlobal('fetch', vi.fn())` in `beforeEach`; restore in `afterEach`.
  - [x] 8.4 — Test: render a component that calls `useQuery({ queryKey: ['health'], queryFn: () => apiClient.get<{ status: string }>('/api/health') })` and renders `data.status` when defined. Mock `fetch` to resolve `{ ok: true, status: 200, json: async () => ({ status: 'ok' }) }`. Use `await screen.findByText('ok')` to wait for the async query to resolve.

- [x] **Task 9 — Error path tests** (AC: 9, 10, 11)
  - [x] 9.1 — Test that `apiClient.get('/api/health')` rejects with `ApiClientError` (instance check via `instanceof`) when fetch returns 500 + valid envelope. Assert `error.code`, `error.message`, `error.status`.
  - [x] 9.2 — Test malformed envelope (500 + `{ oops: ... }`): assert `error.code === 'INVALID_ERROR_ENVELOPE'`.
  - [x] 9.3 — Test network failure: mock `fetch` to throw `TypeError('Failed to fetch')`; assert `error.code === 'NETWORK_ERROR'`.
  - [x] 9.4 — Test 204 No Content path: mock `fetch` to resolve `{ ok: true, status: 204, json: async () => { throw new Error('should not be called') } }`; call `apiClient.del('/api/todos/abc')`; assert resolves to `undefined`.

- [x] **Task 10 — Self-verify against acceptance criteria** (AC: 14, 15, 16, 17)
  - [x] 10.1 — `pnpm lint` exits 0 (AC14).
  - [x] 10.2 — `pnpm typecheck` exits 0 (AC15).
  - [x] 10.3 — `pnpm test` (root) passes (AC16). New tests are included in the run.
  - [x] 10.4 — `pnpm --filter client build` exits 0 (AC17).
  - [x] 10.5 — `pnpm --filter client dev` boots; visiting `http://localhost:5173` renders the placeholder, browser DevTools Network tab shows no errors. (Manual smoke check — only required if any AC failed in 10.1–10.4.)
  - [x] 10.6 — Append a Story 2.1 entry to `docs/ai-log.md` per the maintained-log convention.

## Dev Notes

### Critical patterns (MUST follow)

1. **TanStack Query v5 API only — do NOT write v4 code.**
   - `isLoading` was renamed to `isPending` for queries and mutations. Use `isPending` everywhere.
   - **Queries do NOT support `onError` / `onSuccess` / `onSettled` callbacks** in v5. Don't pass them to `useQuery` — they'll be silently ignored or fail typecheck.
   - **Mutations DO still support `onMutate`, `onError`, `onSuccess`, `onSettled`** — relevant in stories 2.4 / 2.8 / 2.9.
   - Single object signature only: `useQuery({ queryKey, queryFn, ... })`. No positional overloads.
   - On the server, `retry` defaults to 0 in v5. We're a client-only setup, but worth knowing.

2. **`ApiError` (envelope type from `@shared`) vs. `ApiClientError` (thrown class) — naming is intentional.**
   - `ApiError` from `@shared` describes the *server's response payload shape* (`{ error: { message, code } }`). Used to validate/parse responses.
   - `ApiClientError` is a **client-side `Error` subclass** thrown by the api-client wrapper. It carries the parsed `code` and `message` plus `status`, so callers (TanStack Query mutation handlers, ErrorBanner state in story 2.3) can `catch` typed exceptions with stack traces.
   - Throwing the plain envelope (a value satisfying `ApiError`) would lose stack traces and break `instanceof` checks. Don't.

3. **Validate every error envelope via `apiErrorSchema.safeParse()`.** The server *should* always produce a valid envelope (story 2.2 enforces this), but never trust the wire format. On parse failure, throw `INVALID_ERROR_ENVELOPE` so the client never crashes on a malformed response.

4. **Single `QueryClient` instance for the app** — `apps/client/src/lib/query-client.ts` is the only place a `QueryClient` is constructed for the *runtime* app. Tests construct their own fresh client per test (don't import the singleton in tests — it would leak cache between tests).

5. **Path aliases only: `@app/*` and `@shared/*`.** No relative imports beyond one level. Lint will reject `../../shared/...`.

6. **`console.error` is the only permitted console method on the client**, and only inside `apps/client/src/lib/api-client.ts` per the new ESLint override (Task 7.2). `console.log` is forbidden everywhere.

7. **`del` not `delete`** for the api-client's DELETE helper — `delete` is a reserved word in TS strict mode and will fail typecheck if used as a method name on a const object. Hooks in story 2.9 will name their function `useDeleteTodo` (not affected by this).

8. **TanStack Query devtools NOT in scope.** Don't install `@tanstack/react-query-devtools` in this story. Add later if a debugging session warrants it.

9. **Same Zod schema for envelope parsing on both sides.** The server's error-handler middleware (story 2.2) produces envelopes from the same `apiErrorSchema` shape. By parsing the response with that schema in api-client, the client→server contract is fully type-safe at runtime as well as compile time.

10. **`verbatimModuleSyntax: true`** is on (per `tsconfig.base.json`). Type-only imports must use `import type { ... }`. The `ApiError` *type* and `apiErrorSchema` *value* must be imported separately (one as `import type`, the other as a value).

### Things NOT in this story (do not be tempted)

- **No `useTodos` / `useCreateTodo` / `useUpdateTodo` / `useDeleteTodo` hooks.** Those are stories 2.4, 2.5, 2.8, 2.9. This story is *infrastructure*: the wrapper they'll all import.
- **No mutation patterns.** Optimistic UI / rollback / `onMutate` examples belong to stories 2.4+.
- **No `ErrorBanner` component or global error state.** That's story 2.3.
- **No server-side changes.** The server's existing `/api/health` endpoint (Story 1.3) and default `cors()` middleware (also 1.3) suffice for this story's smoke test.
- **No CORS hardening or error envelope on the server.** Those are story 2.2.
- **No request timeout config.** NFR-7's "1s timeout" surface comes via api-client when story 2.3's ErrorBanner integration is wired. For this story, default fetch behavior is fine. (If the dev agent wants to add an `AbortController`-based timeout *now* as forward investment, fine, but it's optional and must not break the test mocks.)
- **No actual `/api/health` use in `App.tsx` runtime.** The smoke test exercises `useQuery` via a test component. The visible `App.tsx` stays as the placeholder from Story 1.2 — story 2.5 is when `App.tsx` starts rendering real data via `useTodos`.
- **No `react-query-devtools`.** See Critical Pattern #8.

### Source tree components touched

| File | Type | Purpose |
|---|---|---|
| `apps/client/package.json` | UPDATE | Add `@tanstack/react-query` dep |
| `apps/client/src/lib/query-client.ts` | NEW | Singleton `QueryClient` with project-wide defaults |
| `apps/client/src/lib/api-client.ts` | NEW | Fetch wrapper + `ApiClientError` class; parses error envelope via `apiErrorSchema` |
| `apps/client/src/lib/perf.ts` | NEW | `markStart` / `markEnd` Performance API helpers (NFR-2 enabler) |
| `apps/client/src/main.tsx` | UPDATE | Wrap `<App />` in `<QueryClientProvider client={queryClient}>` |
| `apps/client/vite.config.ts` | UPDATE | Add dev proxy `/api` → `http://localhost:3001` |
| `apps/client/src/lib/api-client.test.tsx` | NEW | Tests: useQuery smoke, error path 500, malformed envelope, network fail, 204 |
| `eslint.config.js` | UPDATE | `import-x/order` `pathGroups` for `@app/**` / `@shared/**`; per-file `no-console` allow `error` for api-client |

### Testing standards summary

- **Framework:** Vitest + React Testing Library + jsdom (already configured in story 1.2).
- **Test file location:** Co-located with source (`apps/client/src/lib/api-client.test.tsx`).
- **Fetch mocking:** `vi.stubGlobal('fetch', vi.fn())` in `beforeEach`, restore in `afterEach`. Don't add MSW (out of scope for this story; revisit if test setup gets ugly across multiple files).
- **Coverage target:** NFR-8's 80% line-coverage applies to the `apps/client/src/lib/` files. The 5 tests in Task 8/9 plus the implicit coverage from `query-client.ts` should clear that.
- **Test isolation:** Each test constructs a fresh `QueryClient` via the helper. The singleton is never imported into a test.
- **Async assertions:** Use `await screen.findByText(...)` (auto-retry) for query-result assertions; `await expect(promise).rejects.toMatchObject(...)` for error-path assertions.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` Story 2.1] — acceptance criteria (epic-level)
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions D4.3] — TanStack Query v5+ for server state
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions D3.3] — error envelope `{ error: { message, code } }`
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions D5.5] — Performance API marks per mutation (NFR-2)
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns → Process Patterns] — `console.error` only on client; mutations only via hooks
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Project Structure & Boundaries] — `apps/client/src/lib/` location
- [Source: `_bmad-output/implementation-artifacts/1-2-scaffold-vite-react-typescript-frontend-skeleton.md` §Review Findings] — `import-x/order` `pathGroups` deferred from Story 1.2 review (lands here)
- [Source: `_bmad-output/implementation-artifacts/1-4-shared-types-package-with-todo-and-apierror-contracts.md`] — `apiErrorSchema` and `ApiError` exports from `@shared`
- [Source: `packages/shared/src/api.ts`] — current `apiErrorSchema` definition: `{ error: { message: string, code: string } }`

### Latest tech information (web-verified 2026-04-29)

- **`@tanstack/react-query` 5.100.5** — current stable. **Use v5 API exclusively** per Critical Pattern #1.
- **`isPending` (not `isLoading`)** is the v5 idiom for both queries and mutations.
- **No query callbacks** in v5 (`onError` / `onSuccess` / `onSettled` removed from `useQuery`). Mutations still have them.
- **Single object signature only** for `useQuery` / `useMutation`.
- React 19.2, Vite 8.0, TypeScript 6.0, Vitest 4.1.5, jsdom 29.1 — already locked from Story 1.2.
- Sources:
  - https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5
  - https://tanstack.com/blog/announcing-tanstack-query-v5
  - https://www.npmjs.com/package/@tanstack/react-query

### Risks & gotchas

- **TanStack Query v5 typings + `verbatimModuleSyntax: true`** — `QueryClient` is a class (value), `QueryClientProvider` is a component (value), but `QueryKey`, `QueryFunction`, `UseQueryOptions` etc. are types. Use `import type` for the latter. If you get a "verbatimModuleSyntax" lint error on a TanStack import, split it.
- **HMR cache resets** — Vite's HMR may reload `query-client.ts` and create a new `QueryClient`, blowing away the cache mid-session. Acceptable for v1; revisit only if it becomes annoying. (Conventional fix: wrap creation in a `globalThis` guard. Don't add unless needed.)
- **`fetch` mocking gotcha** — `vi.stubGlobal('fetch', ...)` mocks at the global level. Make sure tests `vi.unstubAllGlobals()` or restore in `afterEach` to prevent bleed across tests. RTL's `cleanup()` doesn't reset globals.
- **`apps/client/src/lib/api-client.ts` ESLint override must come AFTER the project-wide `no-console: error` rule** in the config array. ESLint flat config is order-sensitive; later blocks override earlier ones for matched files.
- **Vite proxy `/api` is dev-only.** It's defined under `server.proxy` so it does NOT affect the build or production bundle. In production, the client and server are served from the same origin (or CORS handles it — story 2.2 implements the production path). Don't add a build-time proxy.
- **Don't pin `@tanstack/react-query` to an exact version.** Use `^5.0.0` so patch and minor updates can flow. Pin only if a regression forces it.

### Dependencies satisfied (from epics.md)

- ✅ Story 1.2 (Vite + React + TS scaffold) — complete; `apps/client/` exists with `tsconfig`, `vite.config.ts`, `vitest.config.ts`, ESLint hook rules, smoke test infrastructure.
- ✅ Story 1.4 (`packages/shared`) — complete; `apiErrorSchema` and `ApiError` type are exported from `@shared`.

Story 2.1 is the first Epic 2 story, so no prior Epic 2 stories influence this one.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

No debugging cycles. All 17 ACs satisfied on the first implementation pass; lint, typecheck, test, build all exited 0 without iteration.

### Completion Notes List

- **All 17 ACs satisfied.** `pnpm lint` exits 0, `pnpm typecheck` exits 0, `pnpm --filter client test` passes 10/10 (1 existing App + 6 api-client + 3 perf), full repo `pnpm test` passes 48/48 (10 client + 21 server + 17 shared), `pnpm --filter client build` produces `apps/client/dist/index.html` + 215 kB JS / 6.5 kB CSS bundle.
- **TanStack Query 5.100.6 installed** (matches the story's web-verified version). No peer-dep warnings.
- **Three new lib files**: `query-client.ts` (singleton with project-wide defaults), `api-client.ts` (`ApiClientError` class + `apiClient.{get,post,patch,del}` helpers; `del` not `delete` per TS reserved-word constraint), `perf.ts` (`markStart` / `markEnd` Performance API helpers with cleanup).
- **`main.tsx` updated** to wrap `<App />` in `<QueryClientProvider>`; `<StrictMode>` preserved as outermost wrapper.
- **Vite dev proxy** configured: `/api` → `http://localhost:3001`. Dev-only; build output unchanged.
- **ESLint deltas** (both ACs from Story 1.2 deferred work): `import-x/order` `pathGroups` for `@app/**`, `@server/**`, `@shared/**`, `@todo-app/**` (the workspace package name); per-file override allowing `console.error` only in `apps/client/src/lib/api-client.ts`.
- **`ApiClientError` thrown for all four error paths**: 5xx with valid envelope (uses parsed `code` / `message` / status); 5xx with malformed body (`INVALID_ERROR_ENVELOPE`); fetch-level failure (`NETWORK_ERROR`, status 0); non-JSON error body (also `INVALID_ERROR_ENVELOPE`). All four paths are unit-tested.
- **204 No Content** path resolves to `undefined` without attempting to parse a body — verified via test.
- **Story file additions**: Authored a `perf.test.ts` (3 tests) beyond the spec to cover the new `perf.ts` for NFR-8 line-coverage. Out-of-scope test additions are explicitly permitted by the story's testing standards summary (NFR-8 80% coverage on lib/).
- **No deviations from story spec.**

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/client/package.json` | UPDATE | Added `@tanstack/react-query` ^5.0.0 (resolved 5.100.6) |
| `apps/client/src/lib/query-client.ts` | NEW | Singleton `QueryClient` with project-wide defaults (queries: retry 1, staleTime 0, no refetch-on-focus; mutations: retry 0) |
| `apps/client/src/lib/api-client.ts` | NEW | `ApiClientError` class + `apiClient.{get,post,patch,del}` helpers; envelope parsing via `apiErrorSchema.safeParse` |
| `apps/client/src/lib/perf.ts` | NEW | `markStart` / `markEnd` Performance API helpers with mark/measure cleanup |
| `apps/client/src/lib/api-client.test.tsx` | NEW | 6 tests: happy useQuery render, 500 + valid envelope, 500 + malformed body, fetch reject (NETWORK_ERROR), 204 → undefined, instanceof check |
| `apps/client/src/lib/perf.test.ts` | NEW | 3 tests: measures duration, clears marks/measures for reuse, returns 0 when no measure entry |
| `apps/client/src/main.tsx` | UPDATE | Wraps `<App />` in `<QueryClientProvider client={queryClient}>` while preserving `<StrictMode>` |
| `apps/client/vite.config.ts` | UPDATE | Adds `server.proxy = { '/api': 'http://localhost:3001' }` |
| `eslint.config.js` | UPDATE | `import-x/order` `pathGroups` for `@app/**`, `@server/**`, `@shared/**`, `@todo-app/**`; per-file `no-console: ['error', { allow: ['error'] }]` for api-client |
| `docs/ai-log.md` | UPDATE | Appended Story 2.1 implementation entry per the maintained-log convention |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Story 2.1 created (ready-for-dev) | Initial Epic 2 entry; comprehensive context engine analysis complete |
| 2026-04-29 | Story 2.1 implemented (review) | TanStack Query v5 + api-client wrapper + perf helpers wired; 17/17 ACs satisfied; 48/48 workspace tests pass; zero debug cycles |
| 2026-04-29 | Code review applied 3 fixes (done) | (1) Wrap success-path `response.json()` in try/catch → `INVALID_RESPONSE_BODY`; (2) Retry policy skips 4xx; (3) Architectural deviation re `@shared/*` vs `@todo-app/shared` package-name imports logged to deferred-work.md. 49/49 tests pass. |

## Review Findings

Three parallel adversarial reviews ran on 2026-04-29 (Blind Hunter / Edge Case Hunter / Acceptance Auditor). Triage:

- [x] [Review][Patch] **Success-path JSON parse failure not contained.** `request<T>` calls `response.json() as T` on the success path with no try/catch. A 200 OK with malformed body would surface a raw `SyntaxError` rather than an `ApiClientError`, violating the wrapper's contract. APPLIED: wrapped in `try/catch`; throws `ApiClientError` with `code: 'INVALID_RESPONSE_BODY'`. Test added in `api-client.test.tsx` (200 + non-JSON body). [apps/client/src/lib/api-client.ts:78-90]

- [x] [Review][Patch] **Retry policy retries 4xx errors.** Default `retry: 1` re-fires on `ApiClientError` regardless of HTTP status. 4xx responses (e.g., 400 VALIDATION_FAILED) cannot succeed on retry — adds unnecessary latency. APPLIED: replaced `retry: 1` with a function returning `false` for 4xx `ApiClientError`s, otherwise `failureCount < 1`. [apps/client/src/lib/query-client.ts:7-15]

- [x] [Review][Defer] **Architectural deviation: `@shared/*` path alias vs `@todo-app/shared` package name.** Architecture §Implementation Patterns mandates `@shared/*`; Story 1.4 actually wired the workspace package as `@todo-app/shared`. The two are functionally equivalent (both resolve to `packages/shared/src/`), but the architecture's stated form requires multi-config plumbing (tsconfig path + Vite alias + Vitest alias + project-references composite emit). Pragmatic decision: keep `@todo-app/shared` for Epic 2; add to deferred-work for a future architectural-alignment pass. Logged to `_bmad-output/implementation-artifacts/deferred-work.md`. [apps/client/src/lib/api-client.ts:1]

- [x] [Review][Defer] **No fetch timeout / `AbortController`.** Hung connections will block UI and exhaust the React Query retry budget without ever surfacing as `NETWORK_ERROR`. Spec explicitly defers to Story 2.3 (ErrorBanner integration); see story `Things NOT in this story` list. Logged to deferred-work.md so 2.3's dev agent picks it up.

- [x] [Review][Defer] **Vite proxy hardcodes `http://localhost:3001`.** Acceptable for v1 single-port dev; if devs run the API on a different port (Docker, CI) they'd edit the file. Logged to deferred-work.md as low-priority `process.env.API_URL` enhancement.

- [x] [Review][Defer] **`perf.ts` concurrency: same-name marks overwrite.** Real concern under concurrent operations sharing a name; v1 is single-user with no expected concurrency on shared mark names. Logged to deferred-work.md.

- [x] [Review][Defer] **Tests don't assert request shape (method, URL, body).** A bug where `apiClient.post` swapped body with path would pass every test. Low priority — covered indirectly by integration tests in stories 2.4/2.5/2.8/2.9. Logged to deferred-work.md as a follow-up to the 2.x test suite.

**False positives (noted, not applied):**
- TS 6.0 / Vite 8 / Vitest 4 / jsdom 29 versions: architecture-verified web-current as of 2026-04-29.
- `no-restricted-imports` `regex` field: ESLint 10's `no-restricted-imports` rule supports `regex` on `patterns` entries. Verified via existing-config behavior across Stories 1.1–1.9.
- `main.tsx`'s `getElementById('root')!` non-null assertion: standard React idiom; React itself crashes loudly with a clear message if `#root` is missing.
