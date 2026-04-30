# syntax=docker/dockerfile:1.7
# Multi-stage: build (with workspace install) -> runtime (with pruned deploy).
# pnpm's symlink layout doesn't survive split-stage node_modules COPY, so
# install + build happen in one stage; only the deployed output is copied.

###########
# 1. build #
###########
FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable

# Copy workspace manifests first for layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# Now bring in source and build.
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# Build shared first — its dist/ has to exist before server's tsc resolves
# `@todo-app/shared` (Node can't strip TS inside node_modules at runtime,
# so the published artifact has to be JS).
RUN pnpm --filter @todo-app/shared build
RUN pnpm --filter server build

# `pnpm deploy` produces a self-contained dir with only prod deps and the
# package's own files, suitable for copying into a slim runtime image.
RUN pnpm --filter server --prod --legacy deploy /pruned-server

##############
# 2. runtime #
##############
FROM node:24-alpine AS runtime
WORKDIR /app

# Non-root user.
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /pruned-server/node_modules ./node_modules
COPY --from=build --chown=app:app /pruned-server/package.json ./package.json
COPY --from=build --chown=app:app /workspace/apps/server/dist ./dist
COPY --from=build --chown=app:app /workspace/apps/server/src/db/migrations ./src/db/migrations

USER app

ENV NODE_ENV=production
ENV PORT=3001
ENV BIND=0.0.0.0
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT:-3001}/api/health" || exit 1

CMD ["node", "dist/index.js"]
