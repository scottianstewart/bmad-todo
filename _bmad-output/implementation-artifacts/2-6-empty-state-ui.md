# Story 2.6: Empty state UI (FR-7)

Status: review

## Story

As a **first-time user**,
I want **a friendly empty state inviting me to create my first task**,
so that **I know what to do on initial load without needing instructions**.

## Acceptance Criteria

1. **AC1 — `EmptyState` component.** `apps/client/src/components/EmptyState.tsx` renders a friendly message + a CTA referencing the NewTodoInput. No error styling (no red, no warning iconography). [Source: epics.md 2.6; FR-7]
2. **AC2 — Rendered when `todos.length === 0`.** TodoList renders `<EmptyState />` instead of an empty `<ul>` when the fetch resolves with `[]`.
3. **AC3 — Not rendered when count > 0.** Standard list rendering takes over.
4. **AC4 — Tests.** `EmptyState.test.tsx` + extended `TodoList.test.tsx`.
5. **AC5 — Lint/typecheck/test/build pass.**

## Tasks / Subtasks

- [x] EmptyState component
- [x] TodoList wires it on length === 0
- [x] Tests
- [x] All gates pass

## Dev Notes

The CTA is text-only — pointing the user toward the input that's already directly above. We could add a focus-management call (`document.querySelector('input[aria-label="Add a new todo"]')?.focus()`) on mount, but per AC1 the requirement is "focus-able CTA" not "auto-focus" — leaving that to the user's keyboard / pointer agency.

## Dev Agent Record

### File List
- NEW: `apps/client/src/components/EmptyState.tsx`
- NEW: `apps/client/src/components/EmptyState.test.tsx`
- UPDATE: `apps/client/src/components/TodoList.tsx`
- UPDATE: `apps/client/src/components/TodoList.test.tsx`

### Change Log
| Date | Change |
|---|---|
| 2026-04-29 | Story 2.6 created + implemented |
