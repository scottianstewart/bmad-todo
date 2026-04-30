# Story 1.2: Scaffold Vite + React + TypeScript frontend skeleton

Status: done

<!-- Validation optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **a runnable Vite-based React frontend skeleton with Tailwind configured**,
so that **subsequent UI stories can build on a working dev server**.

## Acceptance Criteria

1. **AC1 — Vite + React + TypeScript scaffold.** `apps/client` contains a Vite 8 + React 19 + TypeScript 6 setup created from the `react-ts` template. [Source: epics.md Story 1.2; architecture.md §Starter Template Evaluation]
2. **AC2 — Tailwind wired.** Tailwind 4.x with `@tailwindcss/vite` plugin is installed and wired into the Vite config. Tailwind utility classes work in components. [Source: epics.md Story 1.2; architecture.md §Decisions D4.6]
3. **AC3 — Placeholder renders.** `App.tsx` renders a placeholder header (e.g., "Todo App") visible in the browser. [Source: epics.md Story 1.2]
4. **AC4 — Dev server runs.** `pnpm --filter client dev` serves the page on localhost. [Source: epics.md Story 1.2]
5. **AC5 — Production build works.** `pnpm --filter client build` produces `apps/client/dist/`. [Source: epics.md Story 1.2]
6. **AC6 — Type-check passes.** `pnpm --filter client typecheck` exits 0. [Source: epics.md Story 1.2]
7. **AC7 — Lint passes.** `pnpm lint` (root-level) exits 0 with the new client source files present. [Source: inferred from AC5 in Story 1.1 + NFR-8]
8. **AC8 — Vitest configured.** Vitest is installed and configured for the client package with React Testing Library. `pnpm --filter client test` runs and passes (at least one smoke test). [Source: architecture.md §Decisions; NFR-8]
9. **AC9 — Path aliases resolve.** `@app/*` path alias resolves correctly in both Vite (dev/build) and TypeScript (typecheck). [Source: architecture.md §Implementation Patterns → Process Patterns → Imports]

## Tasks / Subtasks

- [x] **Task 1 — Scaffold Vite + React + TypeScript app** (AC: 1)
  - [x] 1.1 — Run `pnpm create vite@latest apps/client -- --template react-ts` (or manual equivalent if the scaffolder conflicts with the existing workspace). Remove the `.gitkeep` from `apps/` if it's no longer needed.
  - [x] 1.2 — Clean up scaffolded files: remove Vite boilerplate (default CSS, logos, counter demo) but keep `main.tsx`, `App.tsx`, `index.html`, `vite.config.ts`, `tsconfig.json`.
  - [x] 1.3 — Ensure `apps/client/package.json` has `"name": "client"`, `"private": true`, `"type": "module"`.
  - [x] 1.4 — Run `pnpm install` from root to wire the new workspace member.

- [x] **Task 2 — Configure TypeScript for the client** (AC: 6, 9)
  - [x] 2.1 — Create/update `apps/client/tsconfig.json` to extend `../../tsconfig.base.json`. Set `compilerOptions`: `jsx: "react-jsx"`, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `outDir: "dist"`, `rootDir: "src"`. Set `include: ["src"]`.
  - [x] 2.2 — Add `apps/client/tsconfig.node.json` for Vite config file (targets Node, extends base).
  - [x] 2.3 — Update root `tsconfig.json` to add a project reference to `apps/client/tsconfig.json`.
  - [x] 2.4 — Verify `pnpm --filter client typecheck` exits 0.

- [x] **Task 3 — Configure Vite with path aliases** (AC: 4, 5, 9)
  - [x] 3.1 — Update `apps/client/vite.config.ts`: import `@vitejs/plugin-react`, configure `resolve.alias` for `@app/` → `./src/`. Add `server.port: 5173` (default, explicit).
  - [x] 3.2 — Verify `pnpm --filter client dev` starts the dev server.
  - [x] 3.3 — Verify `pnpm --filter client build` produces `apps/client/dist/`.

- [x] **Task 4 — Install and configure Tailwind 4** (AC: 2)
  - [x] 4.1 — Install Tailwind 4 and its Vite plugin: `pnpm --filter client add -D tailwindcss @tailwindcss/vite`.
  - [x] 4.2 — Add `@tailwindcss/vite` plugin to `vite.config.ts`.
  - [x] 4.3 — Create `apps/client/src/styles/index.css` with Tailwind import directive (`@import "tailwindcss"`).
  - [x] 4.4 — Import `./styles/index.css` in `main.tsx`.

- [x] **Task 5 — Create placeholder App component** (AC: 3)
  - [x] 5.1 — Replace `App.tsx` with a minimal component that renders `<h1>Todo App</h1>` using Tailwind classes (e.g., `text-3xl font-bold`).
  - [x] 5.2 — Verify the placeholder renders in the browser via `pnpm --filter client dev`.

- [x] **Task 6 — Configure Vitest + React Testing Library** (AC: 8)
  - [x] 6.1 — Install test deps: `pnpm --filter client add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`.
  - [x] 6.2 — Create `apps/client/vitest.config.ts` (or configure in `vite.config.ts`) with `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test/setup.ts'`.
  - [x] 6.3 — Create `apps/client/src/test/setup.ts` that imports `@testing-library/jest-dom/vitest`.
  - [x] 6.4 — Add a smoke test `apps/client/src/App.test.tsx` that renders `<App />` and asserts "Todo App" is visible.
  - [x] 6.5 — Add `"test"` script to `apps/client/package.json`: `"vitest run"`.
  - [x] 6.6 — Verify `pnpm --filter client test` passes.

- [x] **Task 7 — Wire ESLint for React** (AC: 7)
  - [x] 7.1 — Install React ESLint plugin: `pnpm add -D eslint-plugin-react-hooks` (at root, to match Story 1.1's pattern).
  - [x] 7.2 — Add a React-specific config block in root `eslint.config.js` that applies `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` to `apps/client/**/*.{ts,tsx}`.
  - [x] 7.3 — Enable type-aware linting for client files by setting `parserOptions.projectService: true` in the client-specific ESLint block.
  - [x] 7.4 — Verify `pnpm lint` exits 0.

- [x] **Task 8 — Update root scripts** (AC: 4, 5)
  - [x] 8.1 — Update root `package.json` scripts: `"dev"` → delegates to client dev (will be extended in story 1.3 for concurrent), `"build"` → `pnpm --filter client build`, `"test"` → `pnpm --filter client test`.
  - [x] 8.2 — Verify `pnpm dev`, `pnpm build`, `pnpm test` all work from root.

- [x] **Task 9 — Self-verify against acceptance criteria** (AC: 1–9)
  - [x] 9.1 — `pnpm --filter client dev` serves the app (AC4)
  - [x] 9.2 — `pnpm --filter client build` produces `apps/client/dist/` (AC5)
  - [x] 9.3 — `pnpm --filter client typecheck` exits 0 (AC6)
  - [x] 9.4 — `pnpm lint` exits 0 (AC7)
  - [x] 9.5 — `pnpm --filter client test` passes (AC8)
  - [x] 9.6 — Tailwind classes render correctly (AC2, AC3)
  - [x] 9.7 — Update `docs/ai-log.md` with Story 1.2 implementation entry

## Dev Notes

### Critical patterns (MUST follow)

1. **Tailwind 4.x uses `@import "tailwindcss"` not `@tailwind` directives.** Tailwind 4 changed its CSS entry point. Do NOT use `@tailwind base; @tailwind components; @tailwind utilities;` — that's Tailwind 3 syntax.

2. **Tailwind 4 does NOT use `tailwind.config.ts`.** Tailwind 4 is zero-config by default and uses CSS-based configuration. Do NOT create a `tailwind.config.ts` or `tailwind.config.js` file. Customization happens via `@theme` in CSS. PostCSS config is also unnecessary when using the Vite plugin.

3. **Path aliases must match Story 1.1's `tsconfig.base.json` exactly.** `@app/*` → `apps/client/src/*`. Vite's `resolve.alias` must mirror this so that dev server and build resolve identically to TypeScript.

4. **ESLint uses `eslint-plugin-import-x` (not `eslint-plugin-import`).** Story 1.1 swapped to the fork for ESLint 10 compatibility. Rules use `import-x/` prefix.

5. **No application logic in this story.** This is scaffold-only. Components, hooks, API client, etc., belong to stories 2.x. The only React code should be the placeholder `App.tsx` and its smoke test.

6. **`verbatimModuleSyntax: true` is set in `tsconfig.base.json`.** All type-only imports must use `import type { ... }` syntax. This is enforced at compile time.

7. **React 19 types.** React 19 ships its own types. Ensure `@types/react` and `@types/react-dom` are installed at the correct version that matches React 19.

8. **Vitest config must use `@tailwindcss/vite` exclusion or handle CSS.** Vitest's jsdom environment won't process Tailwind CSS. Use `css: false` or a mock in the test setup to avoid errors.

### Things NOT in this story (do not be tempted)

- **No TanStack Query setup.** That's story 2.1.
- **No component library (TodoList, TodoItem, etc.).** Those start at story 2.4.
- **No API client or fetch wrapper.** That's story 2.1.
- **No Playwright or e2e tests.** Those are stories 3.x.
- **No Express server or shared package.** Stories 1.3 and 1.4 respectively.
- **No `postcss.config.js`.** Tailwind 4 with the Vite plugin doesn't need it.

### Source tree components touched

| File | Type | Purpose |
|---|---|---|
| `apps/client/package.json` | NEW | Client workspace manifest |
| `apps/client/tsconfig.json` | NEW | Client TS config extending base |
| `apps/client/tsconfig.node.json` | NEW | Vite config TS settings |
| `apps/client/vite.config.ts` | NEW | Vite 8 + React plugin + Tailwind plugin + path aliases |
| `apps/client/vitest.config.ts` | NEW | Vitest config for client tests |
| `apps/client/index.html` | NEW | Vite entry HTML |
| `apps/client/src/main.tsx` | NEW | React root mount + CSS import |
| `apps/client/src/App.tsx` | NEW | Placeholder component |
| `apps/client/src/App.test.tsx` | NEW | Smoke test |
| `apps/client/src/styles/index.css` | NEW | Tailwind CSS entry |
| `apps/client/src/test/setup.ts` | NEW | Vitest setup with RTL |
| `apps/client/src/vite-env.d.ts` | NEW | Vite client types |
| `tsconfig.json` | UPDATE | Add project reference to client |
| `eslint.config.js` | UPDATE | Add React hooks rules for client |
| `package.json` | UPDATE | Update root scripts, add react hooks eslint plugin |

### Testing standards summary

- **Unit test:** One smoke test for `App.tsx` rendering the placeholder header.
- **Framework:** Vitest + React Testing Library + jsdom.
- **No integration or e2e tests** in this story — those come in stories 2.x and 3.x.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` Story 1.2] — acceptance criteria
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Starter Template Evaluation] — Vite 8 + React 19 + TypeScript 6
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Project Structure] — file layout
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns → Enforcement] — React hooks lint rules
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions D4.6] — Tailwind via `@tailwindcss/vite`

### Latest tech information (web-verified 2026-04-29)

- **Vite 8.0** with Rolldown bundler, `@vitejs/plugin-react` v6 (Oxc)
- **React 19.2** current stable
- **Tailwind CSS 4.x** with `@tailwindcss/vite` plugin (zero-config, CSS-based customization, `@import "tailwindcss"` entry)
- **Vitest** latest stable, Vite-native test runner
- **React Testing Library** for component testing

### Risks & gotchas

- **`pnpm create vite` inside an existing workspace** may need `--dir` flag or manual scaffold if it conflicts with workspace root detection.
- **Tailwind 4 breaking changes from v3:** no `tailwind.config.ts`, no `@tailwind` directives, no `postcss.config.js` needed with Vite plugin. Many online guides still show v3 patterns.
- **`eslint-plugin-react-hooks` compatibility with ESLint 10.** Verify at install time; may need the latest version or a compatible fork.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 — `claude-opus-4-6` — operating as Amelia (BMad dev persona) via `bmad-dev-story` skill on 2026-04-29. Validation pass by Claude Sonnet 4.6 in parallel code review session.

### Debug Log References

- **DBG-1** — Vite 8 `pnpm create vite@latest -- --template react-ts` scaffolded a vanilla TypeScript project, not React. Vite 8 changed its template structure. Fix: manually installed React 19, @types/react, @vitejs/plugin-react v6 and converted entry files to `.tsx`.
- **DBG-2** — `pnpm --filter client typecheck` failed with TS6059: `vite.config.ts` outside `rootDir "src"`. Fix: split tsconfig into `tsconfig.json` (src only, `noEmit: true`) and `tsconfig.node.json` (config files). Removed `outDir`/`rootDir` from main tsconfig since `noEmit: true` makes them unnecessary.
- **DBG-3** — `pnpm lint` exit 2: ESLint's `dist/**` ignore didn't match `apps/client/dist/**`. Fix: changed ignores to `**/dist/**`, `**/build/**`, `**/coverage/**` (glob-relative).
- **DBG-4** — `pnpm lint` exit 2: `@typescript-eslint/no-floating-promises` crashed on `vite.config.ts` / `vitest.config.ts` because those files aren't in any tsconfig `include`. Fix: added config-file override block that disables `no-floating-promises` for `**/*.config.{ts,js,mjs}`, and scoped type-aware linting to `apps/**/src/**` and `packages/**/src/**` only.
- **DBG-5** (from parallel review session) — `tsconfigRootDir: import.meta.dirname` added to type-aware linting block for correct project service root resolution. Also `eslint-import-resolver-typescript@^4.4.4` installed at root.

### Completion Notes List

- **All 9 ACs satisfied.** `pnpm --filter client typecheck` exits 0, `pnpm lint` exits 0, `pnpm --filter client test` passes (1/1), `pnpm --filter client build` produces `dist/`.
- **Vite 8.0 + React 19.2 + TypeScript 6.0** installed at current stable versions. `@vitejs/plugin-react` v6 (Oxc transformer) used.
- **Tailwind 4.2** wired via `@tailwindcss/vite` plugin — zero-config, `@import "tailwindcss"` entry, no `tailwind.config.ts` created.
- **Vitest 4.1.5** with jsdom + React Testing Library. `css: false` in vitest config avoids Tailwind CSS processing in tests.
- **`__dirname` in `vite.config.ts`** — works because Vite processes the config file via its own bundler which injects Node globals. TypeScript is satisfied via `@types/node` (transitive from Vite).
- **`eslint-plugin-react-hooks` v7.1.1** — compatible with ESLint 10. `react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn` applied to client files only.
- **Type-aware linting (`no-floating-promises`)** wired via `projectService: true` + `tsconfigRootDir: import.meta.dirname` targeting `apps/**/src/**/*.{ts,tsx}`.

### File List

| File | Type | Purpose |
|---|---|---|
| `apps/client/package.json` | NEW | Client workspace manifest (name: client, Vite/React/Tailwind/Vitest deps) |
| `apps/client/tsconfig.json` | NEW | Client TS config: extends base, jsx: react-jsx, DOM lib, include: src |
| `apps/client/tsconfig.node.json` | NEW | TS config for vite.config.ts + vitest.config.ts (Node target) |
| `apps/client/vite.config.ts` | NEW | Vite 8 + react plugin + tailwind plugin + @app alias + port 5173 |
| `apps/client/vitest.config.ts` | NEW | Vitest: jsdom, globals, setup file, css: false |
| `apps/client/index.html` | NEW | Vite entry HTML (root div, main.tsx module script) |
| `apps/client/public/favicon.svg` | NEW | Vite default favicon |
| `apps/client/src/main.tsx` | NEW | React root mount (StrictMode) + CSS import |
| `apps/client/src/App.tsx` | NEW | Placeholder: `<h1 class="text-3xl font-bold text-gray-900">Todo App</h1>` |
| `apps/client/src/App.test.tsx` | NEW | RTL smoke test: renders App, asserts h1 "Todo App" visible |
| `apps/client/src/styles/index.css` | NEW | Tailwind 4 entry: `@import "tailwindcss"` |
| `apps/client/src/test/setup.ts` | NEW | Vitest setup: imports @testing-library/jest-dom/vitest |
| `apps/client/src/vite-env.d.ts` | NEW | Vite client type reference |
| `tsconfig.json` | UPDATE | Added `{ "path": "apps/client" }` to references array |
| `eslint.config.js` | UPDATE | Added react-hooks block, config-files override, type-aware block with tsconfigRootDir |
| `package.json` | UPDATE | Root scripts: dev/build/test delegate to client; added eslint-plugin-react-hooks, eslint-import-resolver-typescript |

### Review Findings

- [x] [Review][Patch] Root `dev`/`build`/`test` scripts include `apps/server` before story 1.3 — SUPERSEDED: stories 1.3 and 1.4 were already fully implemented; scripts are correct as-is. No action needed. [package.json:scripts]

- [x] [Review][Patch] Root `tsconfig.json` references `{ "path": "apps/server" }` — SUPERSEDED: story 1.3 is already done and `apps/server/` exists; reference is valid. No action needed. [tsconfig.json:4]

- [x] [Review][Patch] `apps/client/tsconfig.json` missing `"composite": true` — APPLIED: added `"composite": true` to `apps/client/tsconfig.json`. Verified: `pnpm --filter client typecheck` and `pnpm --filter client build` both exit 0. `composite: true` + `noEmit: true` are compatible in TypeScript 6. [apps/client/tsconfig.json]

- [x] [Review][Defer] `import-x/order` missing `pathGroups` for `@app/*` — `@app/` imports will be classified as `external` rather than `internal` by the rule, causing incorrect group ordering in stories 2.x [eslint.config.js] — deferred, will surface when `@app/*` imports are added in story 2.x

- [x] [Review][Defer] `vitest.config.ts` `globals: true` without `"types": ["vitest/globals"]` in tsconfig — currently fine (tests explicitly import from `'vitest'`), but will cause TS errors if test files switch to implicit globals [apps/client/tsconfig.json] — deferred, pre-existing low risk

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Scaffold Vite 8 + React 19 + TypeScript 6 client in `apps/client` | Story 1.2 implementation |
| 2026-04-29 | Configured Tailwind 4 via `@tailwindcss/vite`, zero-config | AC2 |
| 2026-04-29 | Wired Vitest + React Testing Library with jsdom | AC8 |
| 2026-04-29 | Added `eslint-plugin-react-hooks` + type-aware ESLint block | AC7 / Task 7 |
| 2026-04-29 | Fixed `no-floating-promises` lint failure by adding `tsconfigRootDir` | DBG-1 (surfaced in Story 1.1 review) |
| 2026-04-29 | Installed `eslint-import-resolver-typescript` | DBG-2 (surfaced in Story 1.1 review) |
| 2026-04-29 | Added `"composite": true` to `apps/client/tsconfig.json` | Story 1.2 code review P3 — required for TS project references |
| 2026-04-29 | Fixed import order in `apps/server/src/db/schema.ts` and `todos-repo.ts` | Pre-existing lint errors from story 1.3/1.4 surfaced during `pnpm lint` verification |
