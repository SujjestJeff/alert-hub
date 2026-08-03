# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Table tokens to hold user twitch access tokens
- Token store for token crud operations
- New token manager as single source of through for usable tokens
- Small wrapper that injects client-id & valid bearer token for helix calls
- Twitch event subscription specification template
- Twitch event client that digests incoming events and actions them
- Twitch event client bootstrap into wiring
- Incoming event normalizer for parsing and de-duping
- Alert queue that manages incoming events/alerts
- Gift aggregator so multi-gifts show as one alert.
- SSE helpers for overlay messaging
- Broadcast hub that decouples the queue from the transport as one broadcast fans out
- Template variable substitution in overlay
- State machine tracking alert state and done status in overlay
- Alert sound support
- Back-end now tracks a configuration schema and checks against it on every write
- Config store manages SQLite JSON rows; in-memory cache; change signal
- Registered the cookie plugin with `SESSION_SECRET` with preHandler guard
- Begin verifying cookie signatures
- Admin routes (/admin/login, /admin/logout, /admin/api/config, /admin/api/config/:kind, /admin/api/settings)
- Alerting rules based on unit counts (bits, count, months)
- Overlay now leverages configuration on normalized
- Admin pages now allow for login, config parsing, and config updates
- Live preview mode in admin app
- Test triggers for visibility in live preview mode
- Tied together all the vitest configs at root level
- Exponential-backoff reconnect for the EventSub Websocket
- A persistent (SQLite backed) message-dedupe store, replacing an in-memory map (survives restarts now)
- Auto-restart of EventSub when the token manager reports a fresh connection
- Readme bootstrap instructions
- Goals tab in the admin dashboard for creating/editing goal bars (metric, target, color) with a live progress preview
- Admin API client calls for goal CRUD and manually setting/simulating a goal's current value
- `goals` overlay widget (`overlay/?widget=goals&token=...`) rendering persistent progress bars, added as a standalone OBS browser source
- "Copy OBS URL" action in the Goals editor for the goals overlay widget link

### Changed

- Replaced authentication route stub with actual endpoints
- Update overlay logic to pickup real SSE's
- /health response shape changed from {status, version, uptime} to {ok, twitch, eventsub}
- Production static-file serving (admin-api + overlay served from backend with SPA fallback routing) was reworked into registerStaticRoutes
- Extracted /overlay/config into its own routes/overlay.ts (was inline in index.ts)
- Dockerfile now builds a slim Node runtime image directly (backend + admin SPA + overlay in one container); the previous jlesage/baseimage-gui/noVNC image is preserved as Dockerfile.jumproom but is no longer the default build
- Service simplified to a single alertbox container with env_file, restart: unless-stopped, and volume mount moved from /app/data to /data.

### Fixed

- dedupeStore.prune()'s interval is now stored and cleared on stop()
- EventSub awaiting getBroadcasterId() at the module level potentially crashes the process if Helix fails or the user isn't authenticated; It now resolves lazily and emits broadcaster-id-error instead of throwing
- Admin login cookie's `secure` flag was tied to `NODE_ENV`, which the Dockerfile always bakes as `production` — every Docker/review-portal boot over plain HTTP silently dropped the cookie and login 401'd forever. Replaced with a dedicated `COOKIE_SECURE` env var (default `false`, explicit opt-in for real HTTPS deploys)

## [0.1.0] - 2026-06-26

### Added

- React 19 + TypeScript app scaffolded with Vite 6
- Hello World initial UI
- ESLint 9 flat config with `typescript-eslint`, `react-hooks`, and `react-refresh` rules
- Dockerfile based on `jlesage/baseimage-gui:ubuntu-20.04-v4` with Chrome and Node.js 20
- React app built during Docker image build and served via `serve` on port 3000
- Chrome launched by `startapp.sh` pointing to the local React app
- noVNC exposes the Chrome session on port 5800
- D-Bus session management in `startapp.sh` (external or local fallback)
- PulseAudio client configuration for socket-based audio
- noVNC UI and dbus/nvidia install overlays from reference image
- CLAUDE.md with React frontend development guidelines
