# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Stage 2: Install all dependencies ────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/engine/package.json ./packages/engine/
COPY packages/logic-parser/package.json ./packages/logic-parser/
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ─── Stage 3: Build shared packages + server ──────────────────────────────────
FROM base AS builder

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/engine/package.json ./packages/engine/
COPY packages/logic-parser/package.json ./packages/logic-parser/

COPY packages/ ./packages/
COPY --from=deps /app/node_modules ./node_modules

COPY apps/server/ ./apps/server/

COPY apps/server/tsconfig.json ./apps/server/
COPY apps/server/tsconfig.build.json ./apps/server/

RUN cd apps/server && /app/node_modules/.bin/prisma generate
RUN pnpm --filter server run build

# ─── Stage 4: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10
WORKDIR /app
RUN apk add --no-cache openssl

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/engine/package.json ./packages/engine/
COPY packages/logic-parser/package.json ./packages/logic-parser/

RUN pnpm install --frozen-lockfile --prod

# Copy the generated Prisma client from builder
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma ./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/server/dist/apps/server/src/main.js"]