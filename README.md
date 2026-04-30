# Todo App

Personal todo app — single-user, server-backed via Express + PostgreSQL, future-auth-ready seam.

## Prerequisites

- Node.js 24 LTS (`nvm use` reads `.nvmrc`)
- pnpm 10+ (`corepack enable`)
- Docker (for local PostgreSQL)

## Quick start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm db:up

# Copy env file
cp .env.example .env

# Run migrations (once DB is ready)
pnpm db:migrate

# Start dev servers (client on :5173, server on :3001)
pnpm dev
```

## Verify database connectivity

```bash
pnpm db:up
docker exec -it todo-app-postgres psql -U todo -d todo -c "SELECT 1;"
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start client (Vite) and server (tsx watch) concurrently |
| `pnpm build` | Build both client and server |
| `pnpm test` | Run all tests (client, server, shared) |
| `pnpm lint` | ESLint across workspace |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm db:up` | Start PostgreSQL via docker compose |
| `pnpm db:generate` | Generate Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |

## Security warning

> **This app has no authentication.** All data is shared under a single anonymous owner. The server binds to `127.0.0.1` (localhost only) by default. **Do not expose this app on a public network** unless you understand the implications — anyone with network access can read, create, modify, and delete all todos.
>
> To bind to a public interface, you must explicitly set `ALLOW_PUBLIC_BIND=true` in your `.env`. The server will refuse to start on a non-loopback address without this flag. See Story 1.8 / architecture decision D2.4 for details.
