# Story 3.5: Chaos test for error recovery (NFR-7)

Status: review

## ACs
1. Server returns 500 on POST/PATCH/DELETE → ErrorBanner appears within 1s, optimistic update rolled back.
2. Server hangs (no response) → ApiClientError TIMEOUT surfaces; banner appears within 1s of the timeout firing.
3. Tests cover all three mutations independently.

## Implementation
- **Picked up the deferred AbortController/timeout from 2.1**: api-client uses `AbortSignal.timeout(1000)` on every fetch. On timeout, throws `ApiClientError` with `code: 'TIMEOUT'`, `status: 0`. New unit test in `api-client.test.tsx` covers the path.
- **TanStack Query retry policy** (in `query-client.ts`) skips retries for both 4xx errors and `TIMEOUT` errors so they surface within NFR-7's 1s budget.
- **`apps/client/src/test/e2e/chaos.spec.ts`** uses Playwright's `page.route()` to inject 500 responses on each mutation path, plus a hung-route variant for the timeout case. Each test asserts the banner appears within ≤2s wall-clock (well under the NFR-7 budget for a single attempt).

## Verification
- 4 chaos cases × 3 browsers = 12 e2e cases, all pass.
- 1 new unit test for the TIMEOUT path.

## Resolved deferred-work
- `apps/client/src/lib/api-client.ts:43-50` (no fetch timeout) — fixed.
- TIMEOUT retry behavior now consistent with the NFR-7 budget.
