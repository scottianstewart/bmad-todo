# Story 2.5: User sees their existing todos on app load (FR-2)

Status: review

## Story

As a **user**,
I want **my existing tasks to be visible when I open the app**,
so that **I don't lose track of what I've already captured**.

## Acceptance Criteria

1. **AC1 — `GET /api/todos` route.** Returns `Todo[]` (JSON array) ordered by `createdAt` DESC. Uses `req.owner` to scope. [Source: epics.md 2.5; architecture D3.1, D2.2]
2. **AC2 — `useTodos` hook.** `apps/client/src/hooks/use-todos.ts` returns `useQuery({ queryKey: ['todos'], queryFn: () => apiClient.get<Todo[]>('/api/todos') })`. [Source: epics.md 2.5; architecture D4.3]
3. **AC3 — `TodoList` component.** `apps/client/src/components/TodoList.tsx` reads `useTodos()`. While `isPending`, renders `<LoadingIndicator />` placeholder (component itself comes in 2.7; for 2.5 just render an empty `null` and let 2.7 replace it). On `isError`, renders `null` (the ErrorBanner already handles user-facing errors). On success, renders an unordered list of `<TodoItem />`. [Source: epics.md 2.5; FR-2; FR-8]
4. **AC4 — `TodoItem` component.** `apps/client/src/components/TodoItem.tsx` renders a single todo's title with a basic completion indicator (checkbox-style placeholder). Toggle / delete behavior added in 2.8 / 2.9; visual distinction for completed state added in 2.10.
5. **AC5 — `TodoList` wired into `App.tsx`.** Replaces the placeholder area between `<NewTodoInput />` and the bottom of `<main>`. [Source: epics.md 2.5]
6. **AC6 — Server tests.** `apps/server/src/routes/todos.test.ts` (extend existing) covers: GET returns array, ordering DESC by createdAt, scoped by req.owner.
7. **AC7 — Client tests.** `apps/client/src/hooks/use-todos.test.tsx` covers loaded data renders. `apps/client/src/components/TodoList.test.tsx` covers list rendering with mock useTodos data.
8. **AC8 — Lint, typecheck, test, build pass.**

## Tasks / Subtasks

- [x] **Task 1 — Server GET route** (AC: 1, 6)
  - [x] 1.1 — Add `router.get('/', async (req, res) => res.json(await repo.list(req.owner)))` to `createTodosRouter`.
  - [x] 1.2 — Extend `apps/server/src/routes/todos.test.ts`: GET happy path with fake repo returning a list, GET with no rows returns `[]`, GET passes `req.owner` to `repo.list`.

- [x] **Task 2 — `useTodos` hook** (AC: 2, 7)
  - [x] 2.1 — Create `apps/client/src/hooks/use-todos.ts`.
  - [x] 2.2 — Test in `apps/client/src/hooks/use-todos.test.tsx` — fetch mock + assert query data resolves.

- [x] **Task 3 — `TodoItem` + `TodoList`** (AC: 3, 4, 7)
  - [x] 3.1 — Create `apps/client/src/components/TodoItem.tsx` (basic title + checkbox-style completion indicator; no toggle/delete handlers yet).
  - [x] 3.2 — Create `apps/client/src/components/TodoList.tsx`.
  - [x] 3.3 — `apps/client/src/components/TodoList.test.tsx`.

- [x] **Task 4 — App.tsx wiring** (AC: 5)
  - [x] 4.1 — Render `<TodoList />` after `<NewTodoInput />`.

- [x] **Task 5 — Self-verify** (AC: 8)
  - [x] 5.1 — Lint, typecheck, test, build all clean.
  - [x] 5.2 — Update `docs/ai-log.md`.

## Dev Notes

### Critical patterns

1. **`useTodos` re-uses the cache key `['todos']`** that `useCreateTodo` writes to. They MUST agree on the key — this is what enables optimistic updates.
2. **Empty array, never null.** `GET /api/todos` returns `[]` if no rows (per architecture format conventions).
3. **`isPending` not `isLoading`** (TanStack Query v5 idiom — already established in 2.1).
4. **TodoList does not render its own error banner.** ErrorBanner is a separate component already in App.tsx and reads from errorBannerStore.
5. **TodoItem stays minimal in 2.5.** Toggle / delete / visual distinction come in 2.8 / 2.9 / 2.10.

### Things NOT in this story

- No EmptyState (2.6).
- No LoadingIndicator (2.7).
- No PATCH/DELETE routes or hooks (2.8/2.9).
- No active-vs-completed visual distinction (2.10).

### Source tree components touched

| File | Type |
|---|---|
| `apps/server/src/routes/todos.ts` | UPDATE |
| `apps/server/src/routes/todos.test.ts` | UPDATE |
| `apps/client/src/hooks/use-todos.ts` | NEW |
| `apps/client/src/hooks/use-todos.test.tsx` | NEW |
| `apps/client/src/components/TodoItem.tsx` | NEW |
| `apps/client/src/components/TodoList.tsx` | NEW |
| `apps/client/src/components/TodoList.test.tsx` | NEW |
| `apps/client/src/App.tsx` | UPDATE |

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
| 2026-04-29 | Story 2.5 created | FR-2 list rendering |
