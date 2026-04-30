# Step 3: Docker Compose containerization

Status: complete

## Deliverables

### `apps/server/Dockerfile`
- Multi-stage: `build` (Node 24 alpine, full pnpm workspace install + `tsc -b`, then `pnpm deploy --legacy --prod` to produce a self-contained dir) → `runtime` (Node 24 alpine, non-root `app` user, `dist/` + pruned node_modules + migrations only).
- HEALTHCHECK pings `/api/health` every 15s.
- Required adding a `build` script to `packages/shared` so `@todo-app/shared` ships as JS — Node can't strip TS inside `node_modules` at runtime. New `tsconfig.build.json` emits `dist/` with declarations; `package.json` `exports` now uses the `source`/`types`/`default` condition keys.

### `apps/client/Dockerfile`
- Multi-stage: `build` (same Node 24 install + `vite build`) → `nginx:1.27-alpine` static serve.
- HEALTHCHECK pings `:80/`.
- nginx container is unprivileged out of the box (upstream image's `nginx` user).

### `apps/client/nginx.conf`
- Long-cache static assets (Vite hashes filenames).
- `/api/` proxies to the `server` service over the Docker network (resolved by service name).
- SPA fallback: `try_files ... /index.html`.

### `docker-compose.yml`
- Two **profiles**: default (postgres only — preserves the local-dev experience) and `full` (postgres + migrate + server + client, end-to-end production-equivalent topology).
- `migrate` service applies SQL via `psql` and exits, with `service_completed_successfully` gating downstream services.
- All services declare healthchecks; `depends_on` with `condition: service_healthy` orchestrates startup order.
- Env vars driven by `.env`-style overrides (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `LOG_LEVEL`, `CORS_ORIGIN`, `SERVER_PORT`, `CLIENT_PORT`).

### `.dockerignore`
- Excludes `node_modules`, `dist`, build artifacts, secrets, docs/_bmad output, CI artifacts.

## End-to-end smoke

`docker compose --profile full up -d` brings the stack online cleanly. Verified: `GET http://127.0.0.1:8080/` serves the React shell; `GET http://127.0.0.1:8080/api/health` returns `{"status":"ok"}` via the nginx → server proxy; `POST http://127.0.0.1:8080/api/todos` creates a row and `GET` returns it. All three containers report healthy.

## Surprises captured during the work

- **`pnpm deploy` requires `--legacy` since pnpm v10** (without `inject-workspace-packages: true`). Ergonomic regression upstream; documented in the Dockerfile.
- **TS module-augmentation breaks under `tsc -b` project-references mode**. The `Request.owner` augmentation in `resolve-owner.ts` worked under the root program (`tsc --noEmit -p .`) but didn't reach `routes/todos.ts` when the server was built in isolation. Replaced with a tiny `ownerOf(req)` helper that casts in one place — same type-safety properties, no augmentation gymnastics.
- **`@todo-app/shared` exports needed an actual JS build step.** Until now the dev/test workflow consumed the package's TS source directly via Vite + tsx; the production runtime image needs JS. This was a known deferred-work item from Story 1.4 — closed during this step.
