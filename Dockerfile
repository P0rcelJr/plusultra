# syntax=docker/dockerfile:1

# ---- deps: install node_modules once, without running lifecycle scripts ----
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat && npm install -g pnpm@10.32.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- builder: generate the Prisma client and build the standalone app ----
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.32.1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# prisma.config.ts refuses to load without DATABASE_URL, but neither generate nor
# next build opens a connection, so a placeholder is enough at image build time.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    pnpm prisma generate && pnpm next build

# ---- migrate: one-shot container that applies migrations before the app starts ----
FROM builder AS migrate
CMD ["pnpm", "prisma", "migrate", "deploy"]

# ---- runner: minimal image with only the standalone output ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
    && mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
