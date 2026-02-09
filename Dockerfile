# ---------- Build stage ----------
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files first
COPY package.json bun.lock ./

# Install all dependencies (dev + prod)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN bun run build

# ---------- Runtime stage ----------
FROM oven/bun:1 AS runner
WORKDIR /app


# Copy Bun modules and package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Copy build output and public assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN bun install --frozen-lockfile --production

# Expose port
EXPOSE 4321

# Start the app
CMD ["bun", "run", "start"]
