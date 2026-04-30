# Story 2.7: Loading state UI (FR-8)

Status: review

## Story

As a **user**,
I want **a non-blocking loading indicator while my todos are being fetched**,
so that **slow loads don't feel like the app is broken**.

## Acceptance Criteria

1. **AC1 — `LoadingIndicator` component.** `apps/client/src/components/LoadingIndicator.tsx` renders an inline non-blocking visual indicator (Tailwind animated spinner; `aria-live="polite"` + screen-reader text "Loading todos…"). [Source: epics.md 2.7; FR-8; NFR-5]
2. **AC2 — Visible when `useTodos().isPending` AND a 200ms-deferral elapses.** TodoList uses a small deferred render: while pending, only after 200ms does the indicator appear. Implemented via a tiny `useDeferredFlag` hook (or inline `useEffect` + `setTimeout`).
3. **AC3 — Replaced by list (or EmptyState) on completion.** Indicator never coexists with populated content.
4. **AC4 — Tests.** `LoadingIndicator.test.tsx` + extended `TodoList.test.tsx` (asserts indicator visible after the 200ms threshold using fake timers).
5. **AC5 — Lint/typecheck/test/build pass.**

## Tasks / Subtasks
- [x] LoadingIndicator component
- [x] 200ms deferral logic in TodoList
- [x] Tests
- [x] All gates pass

## Dev Notes

The 200ms deferral matches FR-8's spec ("visible if fetch >200ms"). Without it, fast networks would flash the indicator briefly, looking janky. With Vitest fake timers we can advance the clock to assert visibility crosses the threshold.

Architecture mandates `isPending` (not `isLoading` — that was renamed in TanStack Query v5). Recorded.

## Dev Agent Record

### File List
- NEW: `apps/client/src/components/LoadingIndicator.tsx`
- NEW: `apps/client/src/components/LoadingIndicator.test.tsx`
- UPDATE: `apps/client/src/components/TodoList.tsx` (add 200ms deferral)
- UPDATE: `apps/client/src/components/TodoList.test.tsx` (extend with deferral test)

### Change Log
| Date | Change |
|---|---|
| 2026-04-29 | Story 2.7 created + implemented |
