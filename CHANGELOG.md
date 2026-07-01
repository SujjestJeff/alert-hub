# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Create table tokens to hold user twitch access tokens 
- Add token store for token crud operations
- Create new token manager as single source of through for usable tokens
- Add small wrapper that injects client-id & valid bearer token for helix calls
- Setup twitch event subscription specification template
- Add twitch event client that digests incoming events and actions them
- Add twitch event client bootstrap into wiring
- Incoming events will be normalized for parsing and deduping
- New alert queue that manages incoming events/alerts
- Add gift aggregator so multi-gifts show as one alert.
- Add SSE helpers for overlay messaging
- Add broadcast hub that decouples the queue from the transport as one broadcast fans out
- Implement template variable substitution in overlay
- Added state machine tracking alert state and done status in overlay
- Added alert sound support

### Changes

- Replaces authentication route stub with actual endpoints
- Update overlay logic to pickup real SSE's

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
