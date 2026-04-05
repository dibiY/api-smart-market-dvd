# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
#   Install only production dependencies (no devDeps).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
#   Install all deps (including devDeps) and compile TypeScript.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner
#   Final image: compiled JS + prod node_modules only. No source, no devDeps.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

USER appuser

EXPOSE 8000

CMD ["node", "dist/main"]
