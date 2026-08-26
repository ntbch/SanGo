# syntax=docker/dockerfile:1
# Build context PHẢI là thư mục gốc repo (docker-compose.yml đã đặt vậy)
# vì app phụ thuộc workspace package @sango/shared.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- deps: cài dependency cho api + shared ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# Lockfile hiện chưa khớp tên importer sau rebrand -> cho phép cập nhật trong ảnh.
# Sau khi chạy 'pnpm install' thật trên máy và commit lockfile mới, đổi sang
# '--frozen-lockfile' để build tái lập 100%.
RUN pnpm install --no-frozen-lockfile --filter @sango/api...

# ---------- build: compile shared + api, sinh prisma client ----------
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @sango/shared build \
 && pnpm --filter @sango/api exec prisma generate \
 && pnpm --filter @sango/api build

# ---------- runner: giữ nguyên cây repo đã build (cần prisma CLI + ts-node cho seed) ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NODE_ENV=production PORT=4000
COPY --from=build /repo /repo
COPY apps/api/docker-entrypoint.sh /repo/docker-entrypoint.sh
RUN chmod +x /repo/docker-entrypoint.sh && chown -R node:node /repo
USER node
EXPOSE 4000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
