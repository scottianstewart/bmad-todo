# Todo App

Personal todo app — single-user, server-backed via Express + PostgreSQL, future-auth-ready seam.

## Prerequisites

- Node.js 24 LTS (`nvm use` reads `.nvmrc`)
- pnpm 10+ (`corepack enable`)
- Docker (for local PostgreSQL)

## Bootstrap (NFR-9 target: clone to running app in < 10 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL (Docker, mapped to localhost:5433)
pnpm db:up

# 3. Copy env file
cp .env.example .env

# 4. Apply migrations
pnpm db:migrate
# If db:migrate hangs or exits 1 with no actionable output, see Troubleshooting below.

# 5. Start dev servers (client on :5173, server on :3001)
pnpm dev
```

Visit http://localhost:5173 — you should see the empty-state UI ("No todos yet"). Add a task; it persists across page refresh and across `pnpm dev` restarts.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start client (Vite) and server (tsx watch) concurrently |
| `pnpm build` | Build both client and server |
| `pnpm test` | Run unit + integration tests (client, server, shared) |
| `pnpm --filter client test:e2e` | Run Playwright cross-browser e2e (requires `pnpm db:up` + migrations) |
| `pnpm lint` | ESLint across workspace |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm db:up` | Start PostgreSQL via docker compose (port 5433) |
| `pnpm db:generate` | Generate Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |

## Security warning (R-2)

> **This app has no authentication.** All data is shared under a single anonymous owner. The server binds to `127.0.0.1` (localhost only) by default. **Do not expose this app on a public network** unless you understand the implications — anyone with network access can read, create, modify, and delete all todos.
>
> To bind to a public interface, you must explicitly set `ALLOW_PUBLIC_BIND=true` in your `.env`. The server will refuse to start on a non-loopback address without this flag. See architecture decision D2.4 for details.

## Troubleshooting

### `pnpm db:up` failed: port 5433 already in use

Another container or service is using port 5433. Stop the conflicting service or change the host port mapping in `docker-compose.yml`. The app deliberately uses 5433 (not 5432) because many development machines have a host-installed PostgreSQL on the default port that would otherwise shadow the container — connections to `localhost:5432` would silently hit the wrong server. **If you change the port, update `DATABASE_URL` in `.env` to match.**

### `pnpm db:migrate` exits with `[⣷] applying migrations...undefined`

`drizzle-kit migrate` has a known silent-failure mode where it exits 1 with no actionable error when the DB is unreachable or in an unexpected state. Workaround: apply the SQL directly:

```bash
docker exec -i todo-app-postgres psql -U todo -d todo < apps/server/src/db/migrations/0000_*.sql
```

### Server returns 500 on `/api/todos` with logs about `role "todo" does not exist`

`localhost` resolves to `::1` (IPv6) before `127.0.0.1` (IPv4) on macOS. If a host PostgreSQL is listening on IPv6 `::1:5433` (uncommon but possible), the API will hit the wrong server. Force IPv4 in `.env`:

```
DATABASE_URL=postgresql://todo:todo@127.0.0.1:5433/todo
```

### Vite dev server's `/api` proxy hits the wrong server

Same dual-stack issue. `apps/client/vite.config.ts` already uses `127.0.0.1` for the proxy target. If you change it, prefer the IP literal over `localhost`.

## Project structure

```
todo-app/
├── apps/
│   ├── client/          # Vite + React 19 + TypeScript + Tailwind + TanStack Query
│   └── server/          # Express 5 + TypeScript + Drizzle ORM + pino
├── packages/
│   └── shared/          # Shared TypeScript types + Zod schemas
├── docker-compose.yml   # Local Postgres 17 (port 5433)
└── .github/workflows/
    ├── ci.yml           # lint + typecheck + test + 80% coverage
    ├── playwright.yml   # cross-browser e2e + a11y (chromium / firefox / webkit)
    └── lighthouse.yml   # LCP < 2s gate on Fast 3G simulated throttling
```

See `_bmad-output/planning-artifacts/architecture.md` for the full architectural context.

## Bootstrap acceptance walkthrough

The bootstrap target is < 10 minutes from clean clone to running app. To validate this stays honest, a recurring task is scheduled: have a developer not previously on the project clone and run through the steps above. Report any friction points; first walkthrough scheduled quarterly.
