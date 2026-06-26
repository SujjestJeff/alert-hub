# alert-hub — Development Guidelines

## Project Overview

Self-hosted Twitch alert box and iframe bootstrapper. The React app runs inside a Chrome browser managed by `jlesage/baseimage-gui`, exposed via noVNC. Users connect over a browser to the noVNC interface on port 5800.

## Tech Stack

- **Framework**: React 19 + TypeScript (TSX)
- **Build tool**: Vite 6
- **Linting**: ESLint 9 flat config with `typescript-eslint`, `react-hooks`, `react-refresh`
- **Container**: `jlesage/baseimage-gui:ubuntu-20.04-v4` + Chrome + `serve` (static file server)

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + Vite build → dist/
npm run lint     # ESLint across all .ts/.tsx files
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
  components/    # Reusable UI components (PascalCase filenames)
  assets/        # Static assets imported by components
  App.tsx        # Root component
  main.tsx       # Entry point — do not add logic here
index.html       # Vite HTML root
install/         # Docker infrastructure (dbus, novnc, nvidia)
startapp.sh      # Container startup: launches serve + Chrome
Dockerfile       # Single-stage build based on jlesage/baseimage-gui
```

## React & TypeScript Conventions

- **Functional components only** — no class components
- **One component per file**, filename matches the component name (PascalCase)
- **TypeScript always** — no `.js` or `.jsx` files in `src/`
- **Props**: define inline or as a `type` above the component; prefer `type` over `interface` for props
- **State**: use `useState` and `useEffect`; reach for external state management only when the task clearly requires it
- **Styles**: plain CSS files or CSS Modules (`.module.css`); no CSS-in-JS libraries
- **Imports**: use relative paths; avoid index barrel files unless there are 5+ exports from a directory

## Linting Rules in Effect

- `react-hooks/rules-of-hooks` — error
- `react-hooks/exhaustive-deps` — warn
- `react-refresh/only-export-components` — warn
- `typescript-eslint` recommended (strict mode via tsconfig)
- `noUnusedLocals` and `noUnusedParameters` enabled in tsconfig

## Docker

Base image: `jlesage/baseimage-gui:ubuntu-20.04-v4`. Follow its conventions:

- **`add-pkg`** instead of raw `apt-get install` — handles cache cleanup automatically
- **`set-cont-env KEY value`** to set internal env vars (e.g. `APP_NAME`, `APP_VERSION`)
- **`rootfs/`** directory mirrors the container filesystem; a single `COPY rootfs/ /` installs all overlays
- **`/etc/cont-init.d/`** for startup scripts — use number range **50–59** for custom scripts; ranges 10–29 and 70–89 are reserved for the baseimage
- **Do not** call `useradd` or manually manage the app user — the baseimage creates it at runtime via `USER_ID`/`GROUP_ID` env vars (default: 1000)
- **`/config`** is the baseimage's standard persistent data directory, automatically owned by the app user

The container build:
1. Sets `APP_NAME`/`APP_VERSION` via `set-cont-env`
2. Installs Chrome dependencies and Chrome itself via `add-pkg`
3. Installs Node.js 20 via NodeSource + `add-pkg nodejs`
4. Builds the React app (`npm run build` → `dist/`)
5. Installs `serve` globally to host `dist/` on port 3000
6. Copies `rootfs/` (noVNC UI, NVIDIA config, PulseAudio config) into the container
7. Chrome launches via `startapp.sh` pointing to `http://localhost:3000`
8. noVNC exposes the Chrome window on port **5800**

To build and run locally:
```bash
docker buildx build --platform linux/amd64 -t alert-hub .
docker run --rm -p 5800:5800 alert-hub
# Open http://localhost:5800 in a browser
```

## Contributing

This project is open source for the Twitch community. Keep PRs focused — one feature or fix per PR. Run `npm run lint` and `npm run build` before opening a pull request.
