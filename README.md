# alert-hub

Self-hosted Twitch alert box. The backend serves a static overlay (add it as a Browser Source in OBS) and will handle Twitch EventSub events in later episodes. An admin panel lets you configure everything from a browser.

## Architecture

| Package | Purpose | Port |
|---|---|---|
| `backend` | Fastify API + static file server | 3000 |
| `admin` | React admin SPA (Vite dev server) | 5173 (dev) |
| `overlay` | Vanilla static overlay, served by backend | `localhost:3000/overlay` |

In production (Docker), the backend serves both the overlay and the built admin SPA on port 3000. There is no separate Vite process.

## Prerequisites

- **Node.js** 20+
- **npm** 10+ (bundled with Node 20)
- **Docker** + **Docker Compose** (for container deployment)

## Local development

```bash
# 1. Copy env template and fill in at minimum PORT and DATABASE_PATH
cp .env.example .env

# 2. Install all workspace dependencies
npm install

# 3. Start backend (port 3000) and admin (port 5173) together
npm run dev
```

Visit:
- **Admin**: http://localhost:5173
- **Health**: http://localhost:3000/health
- **Overlay**: http://localhost:3000/overlay

### Other commands

```bash
npm run build       # TypeScript compile (backend) + Vite build (admin)
npm run typecheck   # Type-check both packages without emitting
npm run lint        # ESLint across all workspaces
npm run format      # Prettier write
```

## Docker (backend container)

`Dockerfile.backend` is the multi-stage Node.js build used for local bootstrap and CI. It builds both the backend and admin, then serves everything from a single container on port 3000.

```bash
docker compose up --build
```

Verify:
```bash
curl http://localhost:3000/health
# {"status":"ok","version":"0.1.0","uptime":3}
```

The SQLite database file is persisted in a named Docker volume (`alertbox-data`). It survives `docker compose down && docker compose up`.

## noVNC deployment (Dockerfile)

The root `Dockerfile` targets `jlesage/baseimage-gui` and serves the admin SPA inside a Chrome window exposed via noVNC on port 5800. This is the original deployment path for the Twitch streaming use case.

```bash
docker buildx build --platform linux/amd64 -t alert-hub .
docker run --rm -p 5800:5800 alert-hub
```

Open http://localhost:5800 — noVNC displays Chrome running the admin UI.

## Port map

| Port | What |
|---|---|
| 3000 | Backend (health, overlay, API stubs, and admin SPA in Docker) |
| 5173 | Admin Vite dev server (local dev only) |
| 5800 | noVNC (jlesage container only) |

## Episode stub locations

| Episode | File | Route |
|---|---|---|
| Episode 1 (OAuth) | `backend/src/routes/auth.ts` | `GET /auth/login` → 501 |
| Episode 2 (EventSub) | `backend/src/db.ts` → `runMigrations()` | — |
| Episode 3 (Queue) | `backend/src/db.ts` → `runMigrations()` | — |
| Episode 4 (SSE) | `backend/src/routes/events.ts` | `GET /events` → 501 |
| Episode 5 (Overlay) | `overlay/main.js` | connects to `/events` |
| Episodes 6-7 (Admin) | `admin/src/App.tsx` | placeholder page |

## Register your own Twitch app

Alert Hub uses the Twitch API on your behalf. You must create a Twitch application to get credentials.

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) and click **Register Your Application**.
2. Give it any name (e.g. "My Alert Hub").
3. Add an **OAuth Redirect URL** — set it to exactly the value of `TWITCH_REDIRECT_URI` in your `.env` file, including protocol, host, port, and path:
   ```
   http://localhost:3000/auth/callback
   ```
   A mismatch here (e.g. trailing slash, wrong port, `https` vs `http`) is the most common setup failure and produces a cryptic Twitch error. Copy it character for character.
4. Set **Category** to "Application Integration" or "Other".
5. Click **Create**.
6. Copy the **Client ID** into `TWITCH_CLIENT_ID`.
7. Click **New Secret**, copy the value immediately (it is shown only once), and paste it into `TWITCH_CLIENT_SECRET`.

> **Security**: never commit `.env` to git. It is listed in `.gitignore`. Only `.env.example` (no secrets) is committed.

OAuth scopes are requested at login time in Episode 1. You do not need to configure them here.

## Contributing

PRs welcome. Run `npm run lint` and `npm run build` before opening one. See [CLAUDE.md](./CLAUDE.md) for architecture and coding conventions.

## License

MIT
