#!/bin/sh
# Khởi động API trong Docker: migrate -> (tuỳ chọn) seed -> node server
set -e
cd "$(dirname "$0")/apps/api"

echo "[api] prisma migrate deploy..."
npx prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "[api] seed dữ liệu demo (SEED_ON_START=true)..."
  npx prisma db seed
else
  echo "[api] bỏ qua seed (SEED_ON_START!=true)"
fi

echo "[api] khởi động server tại port ${PORT}..."
exec node dist/main.js
