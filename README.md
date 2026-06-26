# alert-hub

Self-hosted Twitch alert box and iframe reaction bootstrapper, built for the Twitch community. Runs a React app inside a Chrome browser managed by noVNC — connect to port 5800 in any browser to interact with it.

## What It Does

alert-hub provides a containerized, browser-accessible environment for displaying and managing Twitch alerts. Built to be open source and community-extensible.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (for container deployment)

## Development

```bash
npm install
npm run dev     # http://localhost:5173
```

## Linting & Building

```bash
npm run lint    # ESLint
npm run build   # TypeScript check + Vite build
```

## Docker

```bash
docker build -t alert-hub .
docker run --rm -p 5800:5800 alert-hub
```

Open [http://localhost:5800](http://localhost:5800) — noVNC will display Chrome running the alert-hub React app.

## Contributing

Pull requests welcome. Please run `npm run lint` and `npm run build` before submitting. See [CLAUDE.md](./CLAUDE.md) for architecture and coding conventions.

## License

MIT
