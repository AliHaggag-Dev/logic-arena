# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@10
WORKDIR /app

# ─── Stage 2: Install all dependencies ────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/engine/package.json ./packages/engine/
COPY packages/logic-parser/package.json ./packages/logic-parser/
# shamefully-hoist flattens all binaries (including tsc) into root node_modules/.bin
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ─── Stage 3: Build shared packages + client ──────────────────────────────────
FROM base AS builder
# Build args for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Copy manifests so pnpm workspace resolution works
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/engine/package.json ./packages/engine/
COPY packages/logic-parser/package.json ./packages/logic-parser/

# Copy source for shared packages
COPY packages/ ./packages/

# After copying packages source, copy node_modules from deps stage  
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/client/node_modules ./apps/client/node_modules
COPY --from=deps /app/packages/engine/node_modules ./packages/engine/node_modules
COPY --from=deps /app/packages/logic-parser/node_modules ./packages/logic-parser/node_modules

# Build shared packages first so their dist/ exists for Next.js resolution
RUN pnpm --filter @logic-arena/logic-parser run build
RUN pnpm --filter @logic-arena/engine run build

# Build Next.js client
COPY apps/client/ ./apps/client/
RUN pnpm --filter client run build

# ─── Stage 4: Production runner (Next.js standalone) ──────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output bundles everything — no pnpm needed
COPY --from=builder /app/apps/client/.next/standalone ./
COPY --from=builder /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=builder /app/apps/client/public ./apps/client/public

EXPOSE 3000

# Standalone server.js is emitted at apps/client/server.js relative to monorepo root
CMD ["node", "apps/client/server.js"]
