# Story 3.7: Bootstrap walkthrough acceptance (NFR-9)

Status: review

## ACs
1. README documents the full bootstrap procedure: clone → `pnpm install` → `pnpm db:up` → `pnpm db:migrate` → `pnpm dev` with expected URLs and ports.
2. R-2 deployment-posture warning is prominent.
3. Quarterly walkthrough process item exists.
4. Troubleshooting section captures the friction points discovered during the visual pass.

## Implementation
- README rewrite with a Bootstrap section, complete Scripts table including `test:e2e`, R-2 warning kept prominent, and a new **Troubleshooting** section covering:
  - Port 5433 collision (host PostgreSQL on default port shadowing the container)
  - drizzle-kit silent migrate failure + the `psql -i` workaround
  - macOS IPv6/IPv4 dual-stack collision on `localhost:5433`
  - Vite dev proxy IP-literal preference
- Project structure tree + pointer to architecture document.
- "Bootstrap acceptance walkthrough" section commits to a quarterly cadence.

## Verification
- README is the artifact; rendered preview-readable on GitHub.
- The first walkthrough is scheduled separately (project-ops task).

## Resolves deferred-work items
- Port 5432 collision documented (was a deferred item from the visual pass).
- drizzle-kit silent migrate failure documented (was a deferred item from the visual pass).
