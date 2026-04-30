# syntax=docker/dockerfile:1.7
# Multi-stage: build (full workspace install) -> nginx static serve.

###########
# 1. build #
###########
FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/client ./apps/client
COPY packages/shared ./packages/shared

RUN pnpm --filter client build

##############
# 2. runtime #
##############
FROM nginx:1.27-alpine AS runtime

COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1
