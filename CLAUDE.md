# alert-hub — Development Guidelines

## Project Overview

Self-hosted Twitch alert box. A Fastify backend holds Twitch OAuth tokens (refreshing them before expiry), keeps an EventSub WebSocket open to Twitch, normalizes incoming events, and pushes them through a queue that plays alerts one at a time over Server-Sent Events. The overlay is a static browser page (added to OBS as a Browser Source) that receives alerts over SSE and animates them. A React admin panel edits alert config (templates, sounds, thresholds) and writes it to SQLite, pushing changes live to the overlay. Everything ships as one container on one port.

This is an npm-workspaces monorepo:

- **`backend/`** — Fastify + TypeScript API, Twitch integration, SQLite storage
- **`admin/`** — React 19 + TypeScript + Vite config panel (SPA)
- **`overlay/`** — vanilla JS/CSS overlay page, served statically by the backend

## Tech Stack

- **Backend**: Fastify 5, TypeScript, `better-sqlite3`, `ws`, `zod` for schema/env validation
- **Admin**: React 19 + TypeScript (TSX), Vite 6
- **Overlay**: plain JS/CSS, no framework, no build step
- **Testing**: Vitest (root config ties together backend + admin suites)
- **Linting**: ESLint 9 flat config with `typescript-eslint`, `react-hooks`, `react-refresh`
- **Containers**: one plain `Dockerfile` — see [Docker](#docker) below

## Commands

Run from the repo root unless noted:

```bash
npm run dev        # backend (tsx watch, :3000) + admin (vite, :5173) concurrently
npm run build       # tsc build for backend, then admin (vite build)
npm run lint         # eslint across the whole repo
npm run typecheck    # tsc --noEmit for backend and admin
npm test             # vitest run, all workspaces
npm run format       # prettier --write .
```

Per-workspace (`-w backend` / `-w admin`) versions of `dev`/`build`/`typecheck`/`test` also exist if you only need one side.

## Project Structure

```
backend/
  src/
    alerts/       # normalization, queueing, gift aggregation, threshold rules
    config/       # zod schema + SQLite-backed config store (alert config, settings)
    overlay/      # SSE hub + overlay-token auth
    routes/       # Fastify route modules (auth, admin, events, overlay)
    status/       # status snapshot for the admin status bar
    twitch/       # OAuth, token lifecycle, Helix client, EventSub client
    db.ts         # SQLite connection + migrations
    env.ts        # zod-validated environment config
    index.ts      # wiring: constructs services, registers routes, starts listening
admin/
  src/            # React admin SPA (config editor, live preview, status bar)
overlay/          # static overlay page served at /overlay
Dockerfile          # the one image: slim Node runtime, backend + admin + overlay
docker-entrypoint.sh # bakes placeholder defaults, generates missing secrets on first boot
docker-compose.yml  # image service definition
```

## React & TypeScript Conventions

- **Functional components only** — no class components
- **One component per file**, filename matches the component name (PascalCase)
- **TypeScript always** — no `.js`/`.jsx` in `admin/src`
- **Props**: define inline or as a `type` above the component; prefer `type` over `interface`
- **State**: `useState`/`useEffect`; reach for external state management only when clearly needed
- **Styles**: plain CSS or CSS Modules (`.module.css`); no CSS-in-JS
- **Imports**: relative paths; avoid barrel files unless a directory has 5+ exports

## Backend Conventions

- Route modules in `backend/src/routes/` are thin — validation and business logic live in `alerts/`, `config/`, `twitch/`
- All external input (env vars, config writes, Twitch payloads) is validated with `zod` before use
- Long-lived services (`tokenManager`, `configStore`, `EventSubClient`) are `EventEmitter`s wired together in `index.ts`; avoid reaching across modules directly — emit/listen instead

## Linting Rules in Effect

- `react-hooks/rules-of-hooks` — error
- `react-hooks/exhaustive-deps` — warn
- `react-refresh/only-export-components` — warn
- `typescript-eslint` recommended (strict mode via tsconfig)
- `noUnusedLocals` and `noUnusedParameters` enabled in tsconfig

## Docker

**Ship exactly one Dockerfile.** There used to be a second, JumpRoom-specific image (`Dockerfile.jumproom`) that ran the app inside a Chrome/noVNC shell for visual review. That's retired — the [Review Portal](#review-portal-jumproom) now builds this plain `Dockerfile` directly and pairs its own review shell around the resulting container, so the app image must never bake in browser/VNC scaffolding again. Don't re-add a second Dockerfile for review purposes.

A slim multi-stage Node 20 build: compiles the backend, builds the admin SPA, copies both plus the overlay into a runtime image that serves everything from one Fastify process on port 3000, bound to `0.0.0.0`. This is what `docker-compose.yml` builds and what end users run.

```bash
docker compose up -d
# Admin panel + API + overlay all on http://localhost:3000
```

### Review Portal (JumpRoom)

The Review Portal clones the public repo at the exact commit SHA under review and builds this `Dockerfile` itself — no ECR, no pre-built image, no auth passed to the clone. It boots the resulting container with **zero external configuration**: there is no confirmed mechanism yet for injecting runtime env vars/secrets into the booted review container (the portal's project/PR env var system only reaches the *build* step as non-secret build args). Because of that, the image must be self-sufficient at runtime:

- **Non-secret defaults are baked in as `ENV`** in the Dockerfile (`PORT`, `DATABASE_PATH`, `LOG_LEVEL`, `TWITCH_CLIENT_ID`, `TWITCH_REDIRECT_URI`) so the app boots without a real `.env`.
- **Secrets the app can't function without but that can't be pre-provisioned** (`SESSION_SECRET`, `OVERLAY_TOKEN`, `ADMIN_PASSWORD`, and a `TWITCH_CLIENT_SECRET` placeholder) are generated on first boot by `docker-entrypoint.sh` and persisted next to the SQLite database, so nothing secret-shaped is baked into image layers and values survive restarts if a volume is mounted. Real Twitch OAuth won't work against the placeholder secret — that's expected for a review boot; the admin UI/overlay are still fully reviewable.
- Keep this defaults-plus-first-boot-generation logic in `Dockerfile`/`docker-entrypoint.sh` — it's load-bearing for the review pipeline, not scaffolding to clean up.
- The image just `EXPOSE`s 3000 and binds `0.0.0.0`; it does not launch a browser or set up VNC. The reviewer-facing shell (JumpRoom) is responsible for that, not this repo.
- The repo must stay **public** — the portal's build clone has no auth.

## Contributing

This project is open source for the Twitch community. Keep PRs focused — one feature or fix per PR. Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a pull request.
