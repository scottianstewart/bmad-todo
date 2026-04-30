# Story 2.9: User can delete a todo (FR-4, FR-10)

Status: review

## Story

As a **user**, I want **to remove a task I no longer need**, so that **my list stays focused**.

## Acceptance Criteria

1. DELETE /api/todos/:id route — UUID param validation; uses `repo.delete(req.owner, id)`. Returns 204 No Content (idempotent per D3.2 — even on missing ID).
2. `useDeleteTodo` hook — optimistic remove from cache, onError rollback + errorBannerStore.setError, onSettled invalidate.
3. TodoItem renders a delete button with `aria-label="Delete todo: <title>"`.
4. Persistence: refresh after delete — todo does not return.
5. NFR-7: error banner within 1s on failure.
6. Tests: server (204 happy + 204 missing-id idempotent + 400 invalid UUID); client (hook optimistic + rollback; TodoItem delete-button click).
7. Lint/typecheck/test/build pass.

## Tasks / Subtasks
- [x] Server DELETE route + tests
- [x] useDeleteTodo hook + tests
- [x] TodoItem delete button + tests
- [x] All gates green

## Dev Agent Record
File List in commit; see git log.
