# Production image for the Arcom Outreach Dashboard (Next.js 15 + Prisma + SQLite)
# Multi-stage build → small-ish runtime, migrations run on container start.

FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma needs openssl at build & runtime.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy DB url just so any build-time prisma access is satisfied; real one is set at runtime.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npm run build

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
