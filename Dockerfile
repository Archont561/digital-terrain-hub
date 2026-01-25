# ---------- Build stage ----------
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build


# ---------- Runtime stage ----------
FROM oven/bun:1 AS runner

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

CMD ["bun", "run", "start"]
    