#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec npm run start -- -p "${PORT:-3000}" -H 0.0.0.0
