# Story 2.11: Responsive layout from 320px to 1920px (FR-11)

Status: review

## ACs
1. No horizontal scroll at 320px width — `min-w-0` on flex children, `flex-1` widths, no fixed widths > 320px.
2. Max-width container constrains content at 1920px — already `max-w-2xl` on `<main>` (672px max).
3. Input font-size ≥ 16px — Tailwind `text-base` is 16px.
4. Layout-level smoke test in `App.test.tsx` extension (renders at default jsdom width, asserts no overflow style applied).

## Tasks
- [x] Add `min-w-0` to NewTodoInput's flex children + ensure flex layout doesn't overflow
- [x] Verify input has `text-base` (already present)
- [x] Smoke test that the layout renders without crash at the default jsdom viewport
- [x] All gates pass

## Deferred
Full viewport-level testing across 320 / 640 / 768 / 1024 / 1920px lands in Story 3.3 (Playwright cross-browser matrix) and Story 3.6 (Lighthouse CI). Logged in deferred-work.md if any gap exists. For Story 2.11 the code-level intent is satisfied via Tailwind classes and a render smoke test.
