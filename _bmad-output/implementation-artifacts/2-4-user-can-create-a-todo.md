# Story 2.4: User can create a todo (FR-1, FR-10)

Status: review

## Story

As a **user**,
I want **to add a new task by typing its text and submitting**,
so that **I can capture something I need to do**.

## Acceptance Criteria

1. **AC1 — `POST /api/todos` route.** Accepts JSON body `{ title: string }`, validated against `createTodoInputSchema` from `@todo-app/shared`. On success, creates via repo, returns 201 with the created `Todo` and `Location: /api/todos/:id` header. [Source: epics.md 2.4; architecture D3.1]
2. **AC2 — `req.owner` scope.** Route uses `req.owner` (set by `resolveOwner`) when calling `repo.create(req.owner, req.body)`. [Source: architecture D2.2]
3. **AC3 — Validation failure → 400 + VALIDATION_FAILED.** Empty / whitespace-only / >280-char titles → ZodError → error-handler → 400. [Source: epics.md 2.4]
4. **AC4 — `createTodosRouter(repo)` factory.** `apps/server/src/routes/todos.ts` exports a factory taking the repo dependency, returning the Express router. Allows DI for tests. [Pattern: testability]
5. **AC5 — `createApp(opts?)` accepts repo override.** `createApp({ todosRepo? })` — when omitted, constructs the repo from `createDb(env.DATABASE_URL)` at runtime. Tests pass a fake. [Pattern: testability]
6. **AC6 — `useCreateTodo` hook.** `apps/client/src/hooks/use-create-todo.ts` is a TanStack Query mutation hook with:
   - `mutationFn`: `apiClient.post<Todo>('/api/todos', { title })`
   - `onMutate`: cancel `['todos']` queries, snapshot previous, optimistically prepend a temp todo (with crypto.randomUUID() id, current timestamps, `completed: false`, `ownerId: 'anonymous'`)
   - `onError`: rollback the cache snapshot, call `errorBannerStore.setError(err.message)` (NFR-7)
   - `onSettled`: `queryClient.invalidateQueries(['todos'])` to reconcile
   - Wraps the mutation in `markStart('todo.create')` / `markEnd('todo.create')` for NFR-2 instrumentation
   [Source: epics.md 2.4; architecture D4.5; NFR-7]
7. **AC7 — `NewTodoInput` component.** `apps/client/src/components/NewTodoInput.tsx` renders a controlled `<input>` + a submit `<button>`. Uses `useCreateTodo`. On submit (Enter or button click): call mutate; clear input ONLY on success (preserves input on validation failure per FR-9). Trims input before submit. Disabled state while pending. Max length attribute = 280. [Source: epics.md 2.4; FR-1; FR-9]
8. **AC8 — Wired into `App.tsx`.** `<NewTodoInput />` rendered after `<ErrorBanner />`, before the placeholder heading (which 2.5 will replace with `<TodoList />`). [Source: epics.md 2.4]
9. **AC9 — Server tests.** `apps/server/src/routes/todos.test.ts` covers: 201 happy path; 400 on empty title; 400 on >280 char title; 400 on missing title field; created todo includes `id`, `createdAt`, `completed: false`. Uses a fake repo via `createApp({ todosRepo: fake })`.
10. **AC10 — Client tests.** `apps/client/src/hooks/use-create-todo.test.tsx` covers: mutation succeeds and adds to cache (optimistic insert); on 500, cache rolls back AND `errorBannerStore` is set. `apps/client/src/components/NewTodoInput.test.tsx` covers: submit on Enter, submit on button click, input cleared on success, input preserved on failure, disabled during pending.
11. **AC11 — Lint, typecheck, test, build pass.**

## Tasks / Subtasks

- [x] **Task 1 — Server route + factory** (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 — Convert `apps/server/src/routes/todos.ts` to export `createTodosRouter(repo)`. POST handler only.
  - [x] 1.2 — Update `app.ts`: `createApp(opts?: { todosRepo?: TodosRepo })`. Default constructs `createTodosRepo(createDb(env.DATABASE_URL))`. Wire `app.use('/api/todos', createTodosRouter(repo))`.
  - [x] 1.3 — Export `TodosRepo` type from `todos-repo.ts` (`export type TodosRepo = ReturnType<typeof createTodosRepo>`).

- [x] **Task 2 — `useCreateTodo` hook** (AC: 6)
  - [x] 2.1 — Create `apps/client/src/hooks/use-create-todo.ts` per AC6.
  - [x] 2.2 — Tests with fetch mock + assertion on cache state.

- [x] **Task 3 — `NewTodoInput` component** (AC: 7)
  - [x] 3.1 — Controlled input + submit button. `<form onSubmit={...}>` so Enter submits.
  - [x] 3.2 — Tailwind: `flex gap-2 mb-4`; input `flex-1 rounded border px-3 py-2 text-base`; button `rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50`.
  - [x] 3.3 — `maxLength={280}` on input; `aria-label="Add a new todo"`.

- [x] **Task 4 — Wire into App.tsx** (AC: 8)
  - [x] 4.1 — Render `<NewTodoInput />` between ErrorBanner and the placeholder heading.

- [x] **Task 5 — Tests + verify** (AC: 9, 10, 11)
  - [x] 5.1 — Server `todos.test.ts`.
  - [x] 5.2 — Client `use-create-todo.test.tsx` + `NewTodoInput.test.tsx`.
  - [x] 5.3 — Lint, typecheck, test, build all pass.
  - [x] 5.4 — Update `docs/ai-log.md`.

## Dev Notes

### Critical patterns

1. **Optimistic onMutate must cancel in-flight queries first.** `await queryClient.cancelQueries({ queryKey: ['todos'] })` — otherwise an in-flight refetch may overwrite the optimistic insert with stale server data.
2. **`onMutate` returns the snapshot** — TanStack Query passes it as the third arg to `onError`. Use it to roll back.
3. **`errorBannerStore.setError` from `onError`** — direct call, not via the hook. The store is module-scoped so any subscribed `<ErrorBanner />` re-renders.
4. **`useCreateTodo` stays a function-style hook (no class).**
5. **No `try/catch` in components** — let the mutation hook handle the error path.
6. **Input preservation on failure (FR-9 + NFR-7).** Don't clear input optimistically; only after `onSuccess` (TanStack Query callback that fires when the mutation actually succeeds). The mutation rejection rolls back the cache and sets the banner; the input keeps its value.
7. **Trim before validation.** `title.trim()` before mutate; if the trimmed value is empty, don't even fire the mutation (UX shortcut — server would reject anyway).
8. **`maxLength=280` is a UX cap, not security.** Server's Zod schema is the authoritative cap (`MAX_TITLE_LENGTH = 280`).

### Things NOT in this story

- No `useTodos` query (that's 2.5).
- No `TodoList` rendering (that's 2.5).
- No GET / PATCH / DELETE routes (2.5 / 2.8 / 2.9).

### Source tree components touched

| File | Type |
|---|---|
| `apps/server/src/routes/todos.ts` | NEW |
| `apps/server/src/routes/todos.test.ts` | NEW |
| `apps/server/src/db/todos-repo.ts` | UPDATE (add `TodosRepo` type export) |
| `apps/server/src/app.ts` | UPDATE (DI signature, wire todos router) |
| `apps/client/src/hooks/use-create-todo.ts` | NEW |
| `apps/client/src/hooks/use-create-todo.test.tsx` | NEW |
| `apps/client/src/components/NewTodoInput.tsx` | NEW |
| `apps/client/src/components/NewTodoInput.test.tsx` | NEW |
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
| 2026-04-29 | Story 2.4 created | FR-1 + FR-10 create todo |
