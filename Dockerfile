# Stage 1: install all deps with build tools needed for better-sqlite3 native module
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY admin/package.json ./admin/
RUN npm ci

# Stage 2: compile TypeScript backend and build Vite admin SPA
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.base.json ./
COPY backend ./backend
COPY admin ./admin
COPY overlay ./overlay
RUN npm run build

# Stage 3: slim runtime — no build tools, only what's needed to run
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Non-secret defaults so the container boots with zero external config (e.g.
# for automated review environments). TWITCH_CLIENT_SECRET/OVERLAY_TOKEN/
# SESSION_SECRET/ADMIN_PASSWORD are never baked in — docker-entrypoint.sh
# generates them at first boot instead, so nothing secret-shaped lands in
# the image layers. Override any of these with real values (e.g. via
# docker-compose's env_file) for an actual deploy.
ENV PORT=3000
ENV DATABASE_PATH=/data/alertbox.db
ENV LOG_LEVEL=info
ENV TWITCH_CLIENT_ID=placeholder-client-id
ENV TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback

# Includes compiled native binaries (better-sqlite3) from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/admin/dist ./admin/dist
COPY overlay ./overlay
COPY backend/package.json ./backend/
COPY package.json ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "backend/dist/index.js"]
