# syntax=docker/dockerfile:1
# Build context PHỤI là thư mục gốc repo (docker-compose.yml đã đặt vậy).

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --no-frozen-lockfile --filter @sango/web...

# ---------- build: tsc noEmit + vite build ----------
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter @sango/web build

# ---------- serve: nginx SPA + proxy /api -> api:4000 ----------
FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
