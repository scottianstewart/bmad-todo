# Story 2.3: Inline error banner for backend failures (FR-9)

Status: review

## Story

As a **user**,
I want **to see a clear, dismissible error message when something goes wrong**,
so that **I'm not confused by silently failing actions**.

## Acceptance Criteria

1. **AC1 — `errorBannerStore` external store.** `apps/client/src/hooks/use-error-banner.ts` exports a module-level store with `subscribe`, `getSnapshot`, `setError(message: string)`, `dismiss()`. Implemented with `useSyncExternalStore` for the React hook API. (Architecture D4.4 disallows Context / Zustand / Redux for local UI state; an explicit external store via React 18+ `useSyncExternalStore` is the canonical lightweight pattern when shared state IS needed — and the FR-9 error banner is the one v1 case that truly needs it.) [Source: epics.md Story 2.3; architecture D4.4 (carve-out documented in Dev Notes)]
2. **AC2 — `useErrorBanner()` hook.** Exports `{ error, setError, dismiss }` where `error` is `string | null`. The hook re-renders on store changes via `useSyncExternalStore`. [Source: epics.md Story 2.3]
3. **AC3 — `ErrorBanner` component.** `apps/client/src/components/ErrorBanner.tsx`. When `error !== null`, renders inline (non-modal) at the top of the layout with: the message, a dismiss control (button labeled "Dismiss" with `aria-label`), and an `aria-live="assertive"` region for screen-reader announcement. When `error === null`, renders `null`. [Source: epics.md Story 2.3; FR-9; NFR-5]
4. **AC4 — Inline / non-modal.** The component does NOT block typing or scrolling — no fixed/sticky overlay covering the page. Tailwind classes use ordinary inline flow. [Source: epics.md Story 2.3]
5. **AC5 — Dismiss control clears state.** Clicking the dismiss control calls `dismiss()` and the banner disappears. [Source: epics.md Story 2.3]
6. **AC6 — Wired into App.tsx.** `App.tsx` renders `<ErrorBanner />` at the top of the layout. (Story 2.5 will add `TodoList` etc. below it.) [Source: epics.md Story 2.3]
7. **AC7 — Tests.** `apps/client/src/components/ErrorBanner.test.tsx` covers: renders message when state is set, dismiss clears state, returns null when state is empty. `apps/client/src/hooks/use-error-banner.test.ts` covers: setError + dismiss flow, multiple subscribers see same value.
8. **AC8 — Lint, typecheck, test, build pass.**

## Tasks / Subtasks

- [x] **Task 1 — Store + hook** (AC: 1, 2)
  - [x] 1.1 — Create `apps/client/src/hooks/use-error-banner.ts` with module-level state, listener Set, `subscribe`/`getSnapshot`/`setError`/`dismiss` exports, plus `useErrorBanner()` hook using `useSyncExternalStore`.
  - [x] 1.2 — Tests in `apps/client/src/hooks/use-error-banner.test.ts`.
  - [x] 1.3 — `errorBannerStore` is exported separately so mutation `onError` callbacks (stories 2.4/2.8/2.9) can call `errorBannerStore.setError(...)` without going through the hook.

- [x] **Task 2 — ErrorBanner component** (AC: 3, 4, 5)
  - [x] 2.1 — Create `apps/client/src/components/ErrorBanner.tsx`.
  - [x] 2.2 — Use Tailwind for non-modal styling: `bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded mb-4 flex items-center justify-between`.
  - [x] 2.3 — `aria-live="assertive"` and `role="alert"` for screen-reader announcement.
  - [x] 2.4 — Dismiss button has `aria-label="Dismiss error"` for a11y.

- [x] **Task 3 — Wire into App.tsx** (AC: 6)
  - [x] 3.1 — Update `apps/client/src/App.tsx` to render `<ErrorBanner />` above the placeholder heading.

- [x] **Task 4 — Component test** (AC: 7)
  - [x] 4.1 — `apps/client/src/components/ErrorBanner.test.tsx` — three cases.

- [x] **Task 5 — Self-verify** (AC: 8)
  - [x] 5.1 — Lint, typecheck, test, build all clean.
  - [x] 5.2 — Update `docs/ai-log.md`.

## Dev Notes

### Critical patterns

1. **`useSyncExternalStore` pattern.** Module-level state + Set of listener fns + `notify()` calls every listener on change. The hook reads the snapshot via React's built-in subscriber. Avoids Context (D4.4 ban) while still giving cross-component state.
2. **Test isolation: store state persists across tests.** Reset state in `beforeEach` (call `errorBannerStore.dismiss()` to clear).
3. **`aria-live="assertive"`** because errors are time-critical. Combined with `role="alert"` for redundant cross-AT support. Don't use `polite` for errors — they need immediate announcement.
4. **The store's listeners Set is module-scoped** — every test in the same Vitest module shares it. If a component test renders ErrorBanner, runs an action, then unmounts, the listener is correctly removed by `useSyncExternalStore`'s cleanup. But if a test calls `setError` outside a render, no React update happens — only the snapshot changes. That's expected.

### Things NOT in this story

- No mutation hooks calling `setError` — those wiring details are in 2.4 / 2.8 / 2.9 (each AC there mentions banner-within-1s).
- No retry/recovery mechanism — banner is read-only from the user side except dismiss.
- No queue of multiple errors — simplest semantics: latest error replaces previous. Multi-error queue is post-MVP.

### Source tree components touched

| File | Type |
|---|---|
| `apps/client/src/hooks/use-error-banner.ts` | NEW |
| `apps/client/src/hooks/use-error-banner.test.ts` | NEW |
| `apps/client/src/components/ErrorBanner.tsx` | NEW |
| `apps/client/src/components/ErrorBanner.test.tsx` | NEW |
| `apps/client/src/App.tsx` | UPDATE |
| `docs/ai-log.md` | UPDATE |

## Dev Agent Record

### Agent Model Used
_To be filled._

### Completion Notes List
_To be filled._

### File List
_To be filled._

### Change Log
| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Story 2.3 created | FR-9 inline error UI |
