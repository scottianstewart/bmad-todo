# Step 4: Quality Assurance Activities

Status: complete

## Test coverage

Workspace counts at the time of this report:
- **48 client unit/component tests** (Vitest + RTL)
- **54 server unit/integration tests** (Vitest + supertest, including the 1000-todo persistence integration)
- **17 shared schema tests** (Vitest)
- **45 e2e tests** across Chromium / Firefox / WebKit (Playwright matrix; 1 webkit Tab-order skip is documented OS-level)

Coverage gates already wired in `.github/workflows/ci.yml`: 80% line coverage on server route handlers and client hooks/state per NFR-8. Target rubric: 70% — comfortably exceeded on the high-value paths.

The persistence integration test (`apps/server/src/test/persistence.int.test.ts`) auto-skips when `DATABASE_URL` is unreachable so unit-only `pnpm test` runs don't require Postgres.

Gaps identified by the test-coverage analysis:
- **Shutdown handler logic** in `apps/server/src/index.ts` (SIGTERM/SIGINT paths) is not unit-tested — exercising it would need a child-process harness. Acceptable; logic is small and observable in production logs.
- **`createDb` connection-failure paths** are exercised only indirectly through the persistence test's reachability probe.
- **Rate-limit middleware** (production-only) has no test asserting it's wired correctly — would require `NODE_ENV=production` test mode plus a 101st request. Low priority.

## Performance testing

Lighthouse CI (NFR-6 gate, `.github/workflows/lighthouse.yml`) runs on every PR with simulated Fast 3G throttling and asserts **LCP ≤ 2000ms**. Local run during this step against `vite preview` on port 4173 passed the gate.

Production-build bundle size: 293 kB JS / 6.5 kB CSS (gzipped: 88.85 kB / 1.96 kB). Headroom for additional features without exceeding the LCP budget.

Chrome DevTools MCP performance snapshot deferred — the tools were registered but didn't surface in this session's deferred-tool catalog (known restart-required behavior). Lighthouse already measures the budgeted metric directly; the DevTools MCP would add per-script flamegraphs, which is more useful when chasing a specific regression than during a baseline pass.

## Accessibility

axe-core scans run as part of the Playwright matrix (`apps/client/src/test/e2e/a11y.spec.ts`):
- Empty state — 0 serious/critical violations
- Populated list (3 todos, mixed completion) — 0 violations
- Error banner visible — 0 violations

The first-ever axe run **caught a real WCAG AA contrast failure** (`text-gray-500 + opacity-70` on white = 2.74:1 vs. AA's 4.5:1 minimum). Fixed during Story 3.2 before this step. The axe gate validates the fix on every PR.

Keyboard operability validated by `keyboard.spec.ts` (5 tests covering Enter on input, Tab progression, Space toggling, Enter on delete, focus-visible outline width on every interactive element). 1 webkit skip documented: macOS Safari excludes form controls from default Tab order unless system "Full Keyboard Access" is enabled — the app's Tab order is correct.

## Security review

A parallel security-review subagent ran during Step 3 against the codebase plus the new Dockerfiles. Full findings in the agent's transcript; key actionable items addressed in this step:

### Applied
- **High — no rate limiting**: added `express-rate-limit` at 100 rpm/IP on `/api`, gated to `NODE_ENV === 'production'` so dev/test/e2e runs don't get throttled. Real protection only matters at the deployed surface.
- **Low — pino logs leak credentials**: added `redact: { paths: [...auth-headers, *.password, *.DATABASE_URL], remove: true }` to the logger so accidental error.attached-config logs don't leak the connection string.
- **Low — D1.1 promised a `CHECK (char_length(title) BETWEEN 1 AND 280)` that was never added**: closed with migration `0001_title_length_check.sql`. Drizzle schema gets a matching `check()` so future generated migrations include it.

### Deferred
- **Medium — CORS env required in production**: `CORS_ORIGIN` defaults to `http://localhost:5173`, which silently allowlists the wrong origin if a prod deploy forgets to set it. Should mirror the `DATABASE_URL` required-in-prod pattern. Logged for the next ops pass.
- **Medium — `app.set('trust proxy', ...)` not configured** despite running behind nginx in the `--profile full` topology. `req.ip` would log nginx's container IP rather than the real client; only matters when rate-limit or per-IP audit logic is added. Defer until those land.
- **Medium — `validate` middleware doesn't `.strict()`** schemas. Currently safe (Zod v4 default-strips unknown keys; repo update destructures explicitly), but a single-character schema edit could open a mass-assignment surface. Worth tightening; logged.
- **Medium — `resolveOwner` falls back via `||=`** which preserves any pre-existing `req.owner`. Today there's no path that sets it ahead of the middleware, but this is the auth seam — when real auth lands, the convention should be unconditional overwrite. Logged.

### Confirmed clean
- No SQL injection surface (Drizzle parameterized queries throughout; no raw concatenation).
- No `dangerouslySetInnerHTML` / `eval` / `new Function`.
- No `localStorage` / `cookie` / `sessionStorage` usage in client (architecture-correct: no auth → no session).
- Generic 500 envelope correctly suppresses internal error details (`secret internal detail` test confirms).
- `errorBannerStore.setError` only displays `Could not <verb> todo: <parsed-server-message>`, never raw stack traces.
- No tracked `.env`. Multi-stage Docker builds run as non-root and don't leak build secrets to the runtime image.

## Summary

| Area | Status |
|---|---|
| Test coverage | 119 unit/integration + 45 e2e + 9 axe; ≥80% line coverage gate in CI |
| Performance | Lighthouse LCP gate live; bundle 293 kB gzipped |
| Accessibility | Zero serious/critical axe violations across 3 states × 3 browsers; keyboard operability fully covered |
| Security | High-severity rate-limit gap closed; pino redaction added; charlength CHECK constraint applied; 4 medium items logged for the next ops pass |
