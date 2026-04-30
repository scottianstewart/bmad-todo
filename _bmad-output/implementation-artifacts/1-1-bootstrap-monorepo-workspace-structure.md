# Story 1.1: Bootstrap monorepo workspace structure

Status: done

<!-- Validation optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **a configured pnpm workspace with shared TypeScript settings, lint, and format tooling**,
so that **subsequent stories (1.2 client scaffold, 1.3 server scaffold, 1.4 shared package) have a consistent foundation to build on**.

## Acceptance Criteria

1. **AC1 — Clean install works.** A `pnpm install` from a fresh clone of the repo completes successfully across all workspaces with no errors. [Source: epics.md Story 1.1]
2. **AC2 — Path aliases defined.** `tsconfig.base.json` defines path aliases `@app/*`, `@server/*`, `@shared/*`. [Source: epics.md Story 1.1; architecture.md §Implementation Patterns → Process Patterns → Imports]
3. **AC3 — Workspace declares apps and packages.** `pnpm-workspace.yaml` declares `apps/*` and `packages/*`. [Source: epics.md Story 1.1; architecture.md §Project Structure]
4. **AC4 — Root scripts defined.** Root `package.json` defines exactly these scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `db:up`, `db:generate`, `db:migrate`. (Stub commands — actual implementations land in later stories. `dev` and `build` may delegate to `pnpm --filter` once apps exist; in this story they may print informational messages or be no-ops.) [Source: epics.md Story 1.1; architecture.md §Project Tree]
5. **AC5 — ESLint flat config enforces required rules.** Root `eslint.config.js` (ESLint flat config) enforces: `no-console`, `no-restricted-imports` (no relative imports beyond one level), `no-restricted-syntax` (no `.then()` chains), `import/order`, `@typescript-eslint/no-floating-promises`. [Source: epics.md Story 1.1; architecture.md §Implementation Patterns → Enforcement]
6. **AC6 — Prettier config at root.** A `.prettierrc.json` (or equivalent) is present at the repo root. [Source: epics.md Story 1.1]
7. **AC7 — Standard config files checked in.** `.gitignore`, `.nvmrc` (set to Node 24 LTS), `.editorconfig` are checked in at the repo root. [Source: epics.md Story 1.1; architecture.md §Project Tree]
8. **AC8 — `pnpm lint` passes on the empty workspace.** Running `pnpm lint` on the bootstrapped workspace exits 0 (no source files yet, no failures). [Inferred from AC5 + NFR-8]
9. **AC9 — `pnpm typecheck` passes on the empty workspace.** Running `pnpm typecheck` exits 0. [Inferred from AC4 + NFR-8]

## Tasks / Subtasks

- [x] **Task 1 — Initialize the workspace root** (AC: 1, 3)
  - [x] 1.1 — `pnpm init` at repo root; populate `package.json` with: `"name": "todo-app"`, `"private": true`, `"packageManager": "pnpm@<latest>"`, `"engines": { "node": ">=24.0.0" }`
  - [x] 1.2 — Create `pnpm-workspace.yaml` with content: `packages:\n  - 'apps/*'\n  - 'packages/*'`
  - [x] 1.3 — Create empty `apps/` and `packages/` directories with `.gitkeep` files (so the workspace globs find nothing yet but git tracks the dirs)
  - [x] 1.4 — Verify `pnpm install` completes cleanly with no warnings about missing workspaces (it should be silent — there are no workspace members yet)

- [x] **Task 2 — Add standard config files** (AC: 7)
  - [x] 2.1 — Create `.nvmrc` with content `24` (Node 24 LTS, per architecture TA-2 / verified version table)
  - [x] 2.2 — Create `.gitignore` covering: `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*` (but not `.env.example`), `*.log`, `.DS_Store`, `.idea/`, `.vscode/` (allow per-user overrides as needed)
  - [x] 2.3 — Create `.editorconfig` with sensible defaults (UTF-8, LF, 2-space indent, trim trailing whitespace, insert final newline)

- [x] **Task 3 — Configure shared TypeScript with path aliases** (AC: 2)
  - [x] 3.1 — Create `tsconfig.base.json` at repo root with `compilerOptions`: `target: "ES2023"`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`, `resolveJsonModule: true`, `noUncheckedIndexedAccess: true`
  - [x] 3.2 — Define `paths` in `compilerOptions`: `@app/*` → `apps/client/src/*`, `@server/*` → `apps/server/src/*`, `@shared/*` → `packages/shared/src/*`. (Per-package tsconfigs in stories 1.2 / 1.3 / 1.4 will extend this base; this story only establishes the aliases at the base.)
  - [x] 3.3 — Create a minimal root-level `tsconfig.json` that `extends` `tsconfig.base.json`, sets `include: []` and `references: []` for now. Subsequent stories add references to per-package tsconfigs.

- [x] **Task 4 — Configure Prettier** (AC: 6)
  - [x] 4.1 — Create `.prettierrc.json` with: `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: "always"`, `endOfLine: "lf"`
  - [x] 4.2 — Create `.prettierignore` covering: `node_modules/`, `dist/`, `coverage/`, `pnpm-lock.yaml`, `*.md.bak` (lockfile churn during installs is noisy through Prettier)

- [x] **Task 5 — Configure ESLint flat config with required rules** (AC: 5, 8)
  - [x] 5.1 — Install dev deps at root: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-import`, `eslint-config-prettier`. Pin majors only; let pnpm resolve latest minors. (Confirm latest stable versions at install time — do not hardcode.)
  - [x] 5.2 — Create `eslint.config.js` (ESM flat config) wired to apply across `apps/**/*.{ts,tsx}` and `packages/**/*.ts`. Include the following rule set:
    - `no-console`: `error` (allow `console.error` for client, gated via per-file overrides in later stories — see *Critical patterns* below)
    - `no-restricted-imports`: `error` with patterns `'../../**'` (forbids relative imports beyond one level)
    - `no-restricted-syntax`: `error` for selector matching `.then()` calls (forbids promise chains; require `async`/`await`)
    - `import/order`: `error` with grouping `['builtin', 'external', 'internal', 'parent', 'sibling', 'index']` and `'newlines-between': 'always'`
    - `@typescript-eslint/no-floating-promises`: `error`
    - Standard `@typescript-eslint/recommended` and the `react-hooks` plugin (the latter applied only to client paths in story 1.2; not yet wired here)
  - [x] 5.3 — Append `eslint-config-prettier` last in the config to disable any rules that conflict with Prettier formatting
  - [x] 5.4 — Verify `pnpm lint` (which runs `eslint .`) passes with no errors and no files matched

- [x] **Task 6 — Configure root `package.json` scripts** (AC: 4)
  - [x] 6.1 — Add scripts to root `package.json`:
    - `"dev"`: `"echo 'No apps to run yet — see stories 1.2 (client) and 1.3 (server)'"` (replaced by real concurrent dev command in story 1.3 / 1.6)
    - `"build"`: `"echo 'No packages to build yet'"` (replaced once apps exist)
    - `"test"`: `"echo 'No tests yet'"` (replaced once Vitest is wired in stories 1.2 / 1.3)
    - `"lint"`: `"eslint ."`
    - `"typecheck"`: `"tsc -p tsconfig.json --noEmit"`
    - `"db:up"`: `"echo 'docker-compose up -d added in story 1.5'"` (placeholder)
    - `"db:generate"`: `"echo 'drizzle-kit generate added in story 1.6'"` (placeholder)
    - `"db:migrate"`: `"echo 'drizzle-kit migrate added in story 1.6'"` (placeholder)
  - [x] 6.2 — Verify `pnpm lint` and `pnpm typecheck` both exit 0 (AC8, AC9)

- [x] **Task 7 — Self-verify against acceptance criteria** (AC: 1–9)
  - [x] 7.1 — From a clean checkout (or `rm -rf node_modules && pnpm install`), confirm install completes cleanly (AC1)
  - [x] 7.2 — Run `pnpm lint` → exit 0 (AC8)
  - [x] 7.3 — Run `pnpm typecheck` → exit 0 (AC9)
  - [x] 7.4 — Confirm all 8 expected files / dirs exist: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.nvmrc`, `.editorconfig`, `apps/.gitkeep`, `packages/.gitkeep`
  - [x] 7.5 — Update `docs/ai-log.md` with implementation entry (see *Critical patterns* below)

## Dev Notes

### Critical patterns (MUST follow)

1. **No source files yet.** This story produces *configuration only*. Do not create any `.ts` / `.tsx` source files in this story — that's stories 1.2, 1.3, 1.4. The acceptance criteria are about the workspace meta-config, not application logic.

2. **Path aliases must match the project structure exactly.** Per architecture §Project Tree:
   - `@app/*` → `apps/client/src/*` (NOT `apps/client/*`)
   - `@server/*` → `apps/server/src/*` (NOT `apps/server/*`)
   - `@shared/*` → `packages/shared/src/*` (NOT `packages/shared/*`)
   The `src/` segment is mandatory. Getting this wrong silently breaks every import in stories 1.2+.

3. **ESLint flat config (not legacy `.eslintrc`).** ESLint 9+ uses flat config (`eslint.config.js`). Do not create `.eslintrc.json`, `.eslintrc.js`, or any legacy config file — they will be ignored or cause errors.

4. **Lint rules in this story are the contract for the entire codebase.** Per architecture §Implementation Patterns → Enforcement, these rules are non-negotiable: `no-console`, `no-restricted-imports` (no `../../`), `no-restricted-syntax` (no `.then()`), `import/order`, `@typescript-eslint/no-floating-promises`. Subsequent story implementations rely on these rules being live.

5. **Verify versions at install time — do not hardcode.** Architecture's verified version table (2026-04-29) lists Vite 8, Express 5, Drizzle 0.45.x, TypeScript 6.0, Node 24 LTS. For *this* story you are installing only ESLint, typescript-eslint, eslint-plugin-import, eslint-config-prettier, and Prettier. Confirm latest stable majors at `pnpm add` time. Use `pnpm add -D <pkg>` and let pnpm resolve.

6. **Stub scripts now, real commands later.** Several root scripts (`dev`, `build`, `test`, `db:up`, `db:generate`, `db:migrate`) are placeholders that will be replaced by real commands in subsequent stories. They must exist and exit 0 today, even if they only `echo` a message. This satisfies AC4 without forward-referencing future work.

7. **Append to `docs/ai-log.md` after implementing this story.** A maintenance memory exists for this — every meaningful implementation task is logged with prompts that worked / didn't, surprises, edge cases. For Story 1.1 specifically, log under "Test Generation" if you wrote any verification scripts, and under "Limitations" if anything required human override.

### Things NOT in this story (do not be tempted)

- **No app scaffolding.** Vite create, Express scaffold, shared types, and Drizzle schema all live in stories 1.2 / 1.3 / 1.4 / 1.6 respectively. Do not anticipate them.
- **No docker-compose.** That's story 1.5.
- **No Postgres or env validation.** That's stories 1.5 / 1.7.
- **No CI workflow files.** That's story 1.9.
- **No test runner setup.** Vitest setup happens per-package in stories 1.2 / 1.3.
- **No git hooks (Husky, lint-staged).** Listed in architecture as "nice-to-have post-MVP." Not in scope for v1.

### Source tree components touched

All NEW files. None UPDATE-d (clean repo).

| File | Type | Purpose |
|---|---|---|
| `package.json` | NEW | Workspace root manifest with scripts |
| `pnpm-workspace.yaml` | NEW | Workspace member glob |
| `tsconfig.base.json` | NEW | Shared compiler options + path aliases |
| `tsconfig.json` | NEW | Root tsconfig that extends base, includes nothing yet |
| `eslint.config.js` | NEW | Flat config with required rules |
| `.prettierrc.json` | NEW | Prettier config |
| `.prettierignore` | NEW | Prettier ignore patterns |
| `.gitignore` | NEW | Git ignore |
| `.nvmrc` | NEW | Node 24 LTS pin |
| `.editorconfig` | NEW | Editor defaults |
| `apps/.gitkeep` | NEW | Tracked empty dir |
| `packages/.gitkeep` | NEW | Tracked empty dir |
| `pnpm-lock.yaml` | NEW (generated) | Generated by `pnpm install` |
| `node_modules/` | NEW (generated, ignored) | Generated by `pnpm install` |

### Testing standards summary

This story has **no application code to test**. The validation is operational:
- `pnpm install` completes (AC1) — manual verification
- `pnpm lint` exits 0 (AC8) — manual verification
- `pnpm typecheck` exits 0 (AC9) — manual verification

No Vitest tests in this story. Test infrastructure for the workspace is established per-app in stories 1.2 / 1.3.

### Project Structure Notes

**Alignment with architecture's project tree.** Architecture §Project Structure → Complete Project Tree shows the final layout. This story produces the root level only; `apps/*` and `packages/*` are empty (`.gitkeep` only) until subsequent stories populate them.

**No detected variances.** The acceptance criteria match architecture exactly. If any variance is needed (e.g., a tool not yet released), document it in *Completion Notes* below and surface to John (PM) for re-validation.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` Story 1.1] — primary acceptance criteria
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Project Structure → Complete Project Tree] — file layout
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns → Naming Conventions → Code] — file naming rules
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns → Process Patterns → Imports] — `@app/*`, `@server/*`, `@shared/*` aliases
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Implementation Patterns → Enforcement] — lint rules
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Starter Template Evaluation → Verified Current Versions] — Node 24 LTS, TypeScript 6
- [Source: `_bmad-output/planning-artifacts/architecture.md` §Decisions → D5.3 (env), D5.2 (CI), NFR-8 (coverage gate)] — context for the lint/typecheck gates this story enables
- [Source: `_bmad/prd.md` §Non-Functional Requirements → NFR-8, NFR-9] — type-check + ≥80% coverage gate (this story enables it; full enforcement in story 1.9), <10-min bootstrap target (this story is the foundation)

### Latest tech information (web-verified 2026-04-29)

- **Node.js 24 LTS** is the current default LTS (`.nvmrc` should pin `24`)
- **TypeScript 6.0** is the 2026 baseline (install at the time of writing)
- **ESLint 9+** uses flat config (`eslint.config.js`) — legacy `.eslintrc.*` deprecated
- **typescript-eslint v8+** integrates with ESLint flat config natively (no `parserOptions.tsconfigRootDir` required when using flat config)
- **`@tailwindcss/vite` plugin** for Tailwind 4.x — NOT in scope for this story; mentioned only because story 1.2 will install it
- **pnpm v10+** supports `pnpm-workspace.yaml` workspace globs and `pnpm --filter` cleanly

### Risks & gotchas

- **`tsconfig.json` paths and ESLint flat config can conflict** if path aliases aren't reflected in ESLint's resolver settings. For this story (no source files), it's a non-issue. Stories 1.2 / 1.3 may need to add `eslint-import-resolver-typescript` to make `import/order` and `no-restricted-imports` aware of the aliases. Defer that wiring; flag if `pnpm lint` complains during their implementation.
- **`packageManager` field in root `package.json`** must match the pnpm version actually used — otherwise pnpm refuses to install. Use `pnpm -v` to read the local version and write that exact value.
- **Empty workspace warnings.** Some pnpm versions warn "no projects matched" until at least one workspace member exists. Use `.gitkeep` files in `apps/` and `packages/` to track the dirs but expect either silence or a benign warning at this stage. Not a failure.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — operating as Amelia (BMad dev persona) via the `bmad-dev-story` skill on 2026-04-29.

### Debug Log References

- **DBG-1** — `pnpm` not initially available locally; resolved by `corepack enable && corepack prepare pnpm@latest --activate`. pnpm 10.33.2 active afterward.
- **DBG-2** — Initial `pnpm install` warned: `eslint-plugin-import@2.32.0` peer dep range maxes at ESLint 9; we installed ESLint 10. Mitigated by swapping to `eslint-plugin-import-x@4.16.2` (the maintained ESLint 10–compatible fork). Rule used: `import-x/order` (one character difference from the original `import/order` plan, semantically identical).
- **DBG-3** — First `pnpm typecheck` failed: TypeScript 6.0 deprecates `baseUrl` (TS5101). Fix: removed `baseUrl: "."` from `tsconfig.base.json`; rewrote `paths` values with leading `./`. TS 5+ resolves `paths` relative to the tsconfig file location without requiring `baseUrl`.
- **DBG-4** — First `pnpm lint` emitted `MODULE_TYPELESS_PACKAGE_JSON` warning (non-fatal but noisy). Fix: added `"type": "module"` to root `package.json` (correct anyway since `eslint.config.js` is ESM).
- **DBG-5** — pnpm engine warning on every command: local Node 22.22.0 vs declared `engines.node: >=24.0.0`. Non-blocking. `.nvmrc` correctly pins `24` per AC7; switching to Node 24 is the developer's responsibility (`nvm use`, `fnm use`, etc.) when stories 1.2+ run real app code.

### Completion Notes List

- **All 9 ACs satisfied.** `pnpm install` clean, `pnpm lint` exit 0, `pnpm typecheck` exit 0, all required files present, all required scripts defined, ESLint flat config enforces all 5 required rules.
- **Deviation from story doc — `eslint-plugin-import` → `eslint-plugin-import-x`.** The story's Task 5.1 named `eslint-plugin-import`. That package's stable release (v2.32) caps its ESLint peer at v9; ESLint 10 (current at install time) trips the peer-dep warning. Swapped to `eslint-plugin-import-x@4.16.2`, the maintained fork that supports ESLint 10. Rule name shifts from `import/order` to `import-x/order` (semantically identical). This decision is **forward-compatible**: `eslint-plugin-import-x` is the recommended choice for ESLint 10+ projects in 2026 per the upstream README. Stories 1.2 and 1.3 should continue using `import-x/*` rule prefixes.
- **Deviation from story doc — `tsconfig.base.json` no longer has `baseUrl`.** The story's Task 3.1 listed `baseUrl: "."`. TypeScript 6.0 deprecates `baseUrl` (will stop functioning in TS 7); modern tsconfigs use relative `paths` values without it. The path alias values now read `"./apps/client/src/*"` etc. — same resolution behavior, no deprecation warning. Forward-compatible.
- **Story doc said ESLint "9+" — installed ESLint 10.2.1.** The architecture's verified-versions table (2026-04-29) didn't lock a specific ESLint major. ESLint 10 is current stable as of install time and supports flat config natively. No issue.
- **Skipped TDD (red-green-refactor).** The dev-story workflow's default emphasis on writing failing tests first does not apply to this story — it's config-only with no application logic. The story file explicitly notes "no application code; verification is operational." Validation happened via `pnpm lint` (AC8) and `pnpm typecheck` (AC9) instead.
- **Local Node version mismatch (22 vs declared 24).** `.nvmrc` correctly pins `24` per AC7. pnpm logs a warning on every command but does not fail. When stories 1.2+ start exercising real code paths, switching to Node 24 will be required.
- **Resolved post-implementation:** stakeholder ran `nvm install 24 && nvm use 24` immediately after Story 1.1 marked review. Local Node is now 24.15.0; corepack carried `pnpm@10.33.2` cleanly across the version switch; `pnpm lint` and `pnpm typecheck` both still exit 0. Engine-mismatch warning eliminated.

### File List

| File | Type | Purpose |
|---|---|---|
| `package.json` | NEW | Workspace root manifest (`type: module`, scripts, devDeps, `packageManager: pnpm@10.33.2`, `engines.node: >=24.0.0`) |
| `pnpm-workspace.yaml` | NEW | Declares `apps/*` and `packages/*` workspace globs |
| `pnpm-lock.yaml` | NEW (generated) | Lockfile from `pnpm install` |
| `tsconfig.base.json` | NEW | Shared compiler options + path aliases (`@app/*`, `@server/*`, `@shared/*` — note `src/` segment in each) |
| `tsconfig.json` | NEW | Root tsconfig that extends base; `include: []`, `references: []` (subsequent stories add references) |
| `eslint.config.js` | NEW | ESLint 10 flat config (ESM); enforces `no-console`, `no-restricted-imports`, `no-restricted-syntax` (no `.then()`), `import-x/order`, `@typescript-eslint/no-floating-promises`; ends with `eslint-config-prettier` |
| `.prettierrc.json` | NEW | Prettier config (single quotes, semis, trailing commas, 100-col, LF) |
| `.prettierignore` | NEW | Prettier ignore patterns |
| `.gitignore` | NEW | node_modules, dist, build, coverage, .env (allow .env.example), logs, OS, editor dirs |
| `.nvmrc` | NEW | Pins Node 24 LTS |
| `.editorconfig` | NEW | UTF-8, LF, 2-space, trim trailing, final newline |
| `apps/.gitkeep` | NEW | Tracked empty directory for apps workspace |
| `packages/.gitkeep` | NEW | Tracked empty directory for packages workspace |

**Generated/installed (untracked or partial):** `node_modules/` (ignored via `.gitignore`).

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-04-29 | Initial bootstrap of pnpm workspace, TypeScript config with path aliases, ESLint flat config, Prettier, standard config files | Story 1.1 implementation |
| 2026-04-29 | Substituted `eslint-plugin-import-x` for `eslint-plugin-import` | ESLint 10 peer-dep mismatch (DBG-2) |
| 2026-04-29 | Removed `baseUrl` from `tsconfig.base.json`; rewrote `paths` with leading `./` | TypeScript 6.0 deprecation (DBG-3) |
| 2026-04-29 | Added `"type": "module"` to root `package.json` | ESM-correctness for `eslint.config.js` (DBG-4) |

### Review Findings

- [x] [Review][Defer] `@typescript-eslint/no-floating-promises` wired without type-aware config — deferred to story 1.3; story 1.2 is underway. Story 1.3 MUST add `parserOptions.project: './tsconfig.base.json'` (or equivalent per-app tsconfig path) to `eslint.config.js` for the rule to be type-aware.

- [x] [Review][Patch] Missing `eslint-import-resolver-typescript` in devDependencies — installed `eslint-import-resolver-typescript@^4.4.4`; `pnpm lint` passes. [eslint.config.js:86-95 / package.json:devDependencies]

- [x] [Review][Patch] `no-restricted-imports` pattern list stopped at `../../../../**`; paths with 5+ `../` segments not blocked — replaced enumerated patterns with regex `^(\\.\\./){2,}`; also added `tsconfigRootDir: import.meta.dirname` to the type-aware linting block (was breaking `no-floating-promises` with story 1.2 source files present). [eslint.config.js]

- [x] [Review][Defer] Path alias targets (`./apps/client/src/*` etc.) don't exist yet [tsconfig.base.json:15-19] — deferred, pre-existing (by design; targets created in stories 1.2/1.3/1.4)

- [x] [Review][Defer] `.vscode/` excluded from `.gitignore` — shared workspace config (extensions.json, settings.json) is not committed [.gitignore] — deferred, pre-existing (design decision per story task 2.2; revisit if team collaboration is added)

### AI log entry checklist (Story 1.1)

After implementation completes, append to `docs/ai-log.md`:

- **Agent Usage:** Story 1.1 implementation — dev persona, prompts that worked / didn't, surprise gotchas (`packageManager` field version pin, ESLint flat config wiring, etc.)
- **Test Generation:** N/A for Story 1.1 (config-only story; no application logic to test)
- **Debugging:** Any iteration cycles required to make `pnpm lint` / `pnpm typecheck` exit clean
- **Limitations:** Anything the AI couldn't do without human override (version verification, package manager resolution, etc.)
