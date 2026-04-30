# Story 1.9: CI pipeline — lint, type-check, test, coverage

Status: review

## Story

As a **developer / maintainer**,
I want **every PR gated by lint, type-check, and test passes with ≥80% coverage on critical paths**,
so that **broken changes cannot merge**.

## Acceptance Criteria

1. **AC1 — Workflow file.** `.github/workflows/ci.yml` triggered on PRs and pushes to `main`. [Source: epics.md Story 1.9]
2. **AC2 — Pipeline steps.** Workflow runs: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test --coverage`. [Source: epics.md Story 1.9]
3. **AC3 — Coverage gate.** Workflow fails if line coverage on server route handlers or client hooks/state falls below 80%. [Source: epics.md Story 1.9; NFR-8]
4. **AC4 — Lint passes.** `pnpm lint` exits 0. [Source: NFR-8]
5. **AC5 — Typecheck passes.** `pnpm typecheck` exits 0. [Source: NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Create CI workflow** (AC: 1, 2, 3)
  - [x] 1.1 — Create `.github/workflows/ci.yml` with concurrency group.
  - [x] 1.2 — Steps: checkout, pnpm setup, Node setup (from .nvmrc), frozen install, lint, typecheck, test with coverage.
  - [x] 1.3 — Server coverage check: parse coverage-summary.json, fail if lines < 80%.
  - [x] 1.4 — Client coverage check: parse coverage-summary.json, fail if lines < 80%.

- [x] **Task 2 — Verify all gates** (AC: 4, 5)
  - [x] 2.1 — `pnpm lint` exits 0
  - [x] 2.2 — `pnpm typecheck` exits 0
  - [x] 2.3 — `pnpm test` passes (all packages)

## Dev Notes

### Critical patterns

1. **`pnpm/action-setup@v4`** handles pnpm installation in CI.
2. **`actions/setup-node@v4`** with `node-version-file: '.nvmrc'` ensures CI uses same Node version as dev.
3. **Concurrency group** cancels in-progress runs on the same branch.
4. **ESM-compatible coverage parsing** — uses `node --input-type=module` with `import { readFileSync }` instead of `require()`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

No issues encountered.

### Completion Notes List

- **All 5 ACs satisfied.** CI workflow with lint, typecheck, test + coverage gates for server and client.
- **Cannot fully validate CI in local dev** — the workflow requires GitHub Actions to run. Syntax and structure verified manually.

### File List

| File | Type | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | NEW | CI pipeline: lint, typecheck, test with 80% coverage gate |

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Created .github/workflows/ci.yml | Story 1.9 implementation |
