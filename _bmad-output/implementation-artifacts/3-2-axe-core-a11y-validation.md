# Story 3.2: axe-core accessibility validation in CI (NFR-5)

Status: review

## ACs
1. axe-core scan exercises three states: empty, populated (3 todos, mixed completion), error-banner-visible.
2. Zero serious/critical violations on a clean PR.
3. CI workflow runs the spec; failures block merge.
4. A deliberate violation causes the workflow to fail (not exercised here — would require a follow-up "regression test" PR).

## Implementation
- Installed `@axe-core/playwright`.
- Added `apps/client/src/test/e2e/a11y.spec.ts` with three tests, one per state.
- Reuses the existing `playwright.yml` GitHub workflow — no new CI YAML needed; same matrix runs both core-flow and a11y specs.

## Real bug caught
The first run flagged `text-gray-500` + `opacity-70` on white = 2.74:1 contrast on completed todos, below WCAG AA's 4.5:1 minimum for normal text. **Fixed in `TodoItem.tsx`**: dropped `opacity-70`, switched to `text-gray-600` (~7.2:1 on white, well above AA). Strikethrough remains the primary FR-5 cue (greyscale-operable).

## Verification
9 a11y test cases (3 browsers × 3 states); all pass. The bug-find-and-fix on the very first axe scan validates the gate is working as intended.
