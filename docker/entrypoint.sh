#!/bin/sh
set -eu

if [ ! -x node_modules/.bin/next ]; then
  echo "[docker] instalando dependencias..."
  npm ci
fi

echo "[docker] prisma generate + db push..."
npx prisma generate
npx prisma db push

echo "[docker] seed (idempotente)..."
npx prisma db seed || echo "[docker] seed omitido o falló (la app igual arranca)"

echo "[docker] next dev en 0.0.0.0:3000"
exec npm run dev:docker
