# --- STAGE 1: Base (Dependency installation) ---
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# --- STAGE 2: Builder (Compiling the code) ---
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Pass build arguments here
ARG NEXT_PUBLIC_MARKET_API_URL
ENV NEXT_PUBLIC_MARKET_API_URL=${NEXT_PUBLIC_MARKET_API_URL}

# Build the project
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- STAGE 3: Runner (The final tiny image) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Create a non-root user for security (Best Practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY ONLY THE NECESSARY FILES (This is where the size saving happens)
# 1. Copy the public folder
COPY --from=builder /app/public ./public

# 2. Copy the standalone build (traced dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

# Note: In standalone mode, we run server.js, not npm start
CMD ["node", "server.js"]