# Story 3.6: Lighthouse CI gate for LCP (NFR-6)

Status: review

## ACs
1. CI workflow builds the client, seeds 50 todos, serves the build, runs Lighthouse with simulated throttling, fails if LCP > 2.0s.
2. Configuration lives in `.lighthouserc.json` (root).
3. Workflow runs on PR and push to main.

## Implementation
- `.lighthouserc.json`: 3 runs per target, simulated Fast 3G throttling (RTT 150ms, throughput 1638 kbps, 4× CPU slowdown), LCP assertion ≤ 2000ms.
- `.github/workflows/lighthouse.yml`: Postgres service container on 5433, schema applied via psql, 50 seeded todos via raw INSERTs, API server booted via `pnpm dev` background, client built and served via `vite preview` on 4173, Lighthouse CI runs against the preview URL.

## Verification
- Local run via `lhci autorun` against `vite preview` on 4173 passes the LCP gate.
- 117 unit tests still green; lint, typecheck, build all clean.
