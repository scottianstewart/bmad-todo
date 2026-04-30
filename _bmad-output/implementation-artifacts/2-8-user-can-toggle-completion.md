# Story 2.8: User can toggle a task's completion state (FR-3, FR-10)

Status: review

## Story

As a **user**, I want **to mark a task complete or uncomplete with a single click**,
so that **I can keep my list current as I finish things**.

## Acceptance Criteria

1. PATCH /api/todos/:id route — `updateTodoInputSchema` body validation; UUID param validation; uses `repo.update(req.owner, id, body)`. 200 + updated Todo; 404 + TODO_NOT_FOUND if not found.
2. `useUpdateTodo` hook — optimistic flip in cache, onError rollback + errorBannerStore.setError, onSettled invalidate.
3. TodoItem renders a toggle control (checkbox `<button role="checkbox">` with `aria-checked`).
4. Idempotency: double-fire on the same target state lands at the same final state (D3.2).
5. NFR-7: error banner appears within 1s of failed call.
6. Tests: server (200, 404, 400 invalid UUID, 400 invalid body); client (hook optimistic + rollback; TodoItem toggle calls hook).
7. Lint/typecheck/test/build pass.

## Tasks / Subtasks
- [x] Server PATCH route + tests
- [x] useUpdateTodo hook + tests
- [x] TodoItem toggle wiring + tests
- [x] All gates green

## Dev Agent Record
File List in commit; see git log.
