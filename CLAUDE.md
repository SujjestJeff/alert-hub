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
- **Containers**: two separate, both maintained — see [Docker](#docker) below

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
rootfs/            # container filesystem overlay for the jumproom image (see Docker)
Dockerfile          # primary image: slim Node runtime, backend + admin + overlay
Dockerfile.jumproom # alternate image: app running inside a noVNC-accessible browser
startapp.sh         # jumproom container startup (launches Chrome via the baseimage)
docker-compose.yml  # primary image service definition
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

There are **two separate, both-maintained** container images. Don't conflate them.

### Primary: `Dockerfile`

The production deploy path. A slim multi-stage Node 20 build: compiles the backend, builds the admin SPA, copies both plus the overlay into a runtime image that serves everything from one Fastify process on port 3000. This is what `docker-compose.yml` builds and what end users run.

```bash
docker compose up -d
# Admin panel + API + overlay all on http://localhost:3000
```

### Jumproom: `Dockerfile.jumproom`

A separate, intentional environment for **visually reviewing the running app** — e.g. design/UX review during stream sessions — by putting it inside a real Chrome instance exposed over noVNC, rather than just reading source or a static build. This is **not legacy and not a fallback**; it's actively maintained alongside the primary image for that review workflow. Base image: `jlesage/baseimage-gui:ubuntu-20.04-v4`.

Follow the baseimage's conventions when touching this file or `rootfs/`:

- **`add-pkg`** instead of raw `apt-get install` — handles cache cleanup automatically
- **`set-cont-env KEY value`** to set internal env vars (e.g. `APP_NAME`, `APP_VERSION`)
- **`rootfs/`** mirrors the container filesystem; `COPY rootfs/ /` installs all overlays (noVNC UI, NVIDIA/EGL config, PulseAudio client config)
- **`/etc/cont-init.d/`** for startup scripts — use number range **50–59** for custom scripts; ranges 10–29 and 70–89 are reserved for the baseimage
- **Do not** call `useradd` or manually manage the app user — the baseimage creates it at runtime via `USER_ID`/`GROUP_ID` (default: 1000)
- **`/config`** is the baseimage's standard persistent data directory, owned by the app user
- `startapp.sh` launches Chrome pointed at the built admin app; noVNC exposes that Chrome window on port **5800**

```bash
docker buildx build --platform linux/amd64 -f Dockerfile.jumproom -t alert-hub-jumproom .
docker run --rm -p 5800:5800 alert-hub-jumproom
# Open http://localhost:5800 in a browser to visually drive the app
```

## Contributing

This project is open source for the Twitch community. Keep PRs focused — one feature or fix per PR. Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a pull request.
