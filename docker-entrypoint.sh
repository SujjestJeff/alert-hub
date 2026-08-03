#!/bin/sh

set -eu

log() {
    echo "[docker-entrypoint] $*"
}

# Secrets aren't baked into the image — generate them here on first boot and
# persist alongside the SQLite database (same volume, if one is mounted) so
# they survive container restarts. An OVERLAY_TOKEN or SESSION_SECRET that
# changed every restart would break the OBS browser source / log everyone out.
SECRETS_DIR="$(dirname "$DATABASE_PATH")/.secrets"
mkdir -p "$SECRETS_DIR"

gen_hex() {
    node -e "console.log(require('crypto').randomBytes($1).toString('hex'))"
}

load_or_generate_file() {
    file="$1"
    bytes="$2"
    if [ ! -f "$file" ]; then
        gen_hex "$bytes" > "$file"
        chmod 600 "$file"
    fi
    cat "$file"
}

if [ -z "${SESSION_SECRET:-}" ]; then
    SESSION_SECRET="$(load_or_generate_file "$SECRETS_DIR/session_secret" 32)"
    export SESSION_SECRET
fi

if [ -z "${OVERLAY_TOKEN:-}" ]; then
    OVERLAY_TOKEN="$(load_or_generate_file "$SECRETS_DIR/overlay_token" 32)"
    export OVERLAY_TOKEN
fi

if [ -z "${ADMIN_PASSWORD:-}" ]; then
    ADMIN_PASSWORD="$(load_or_generate_file "$SECRETS_DIR/admin_password" 12)"
    export ADMIN_PASSWORD
    log "No ADMIN_PASSWORD set — generated one (saved to $SECRETS_DIR/admin_password): $ADMIN_PASSWORD"
fi

if [ -z "${TWITCH_CLIENT_SECRET:-}" ]; then
    export TWITCH_CLIENT_SECRET="placeholder-client-secret"
    log "WARNING: TWITCH_CLIENT_SECRET not set — Twitch OAuth/EventSub will not work. Pass -e TWITCH_CLIENT_ID=... -e TWITCH_CLIENT_SECRET=... for a real integration."
fi

log "Overlay URL for OBS Browser Source: http://localhost:${PORT:-3000}/overlay?token=$OVERLAY_TOKEN"

exec "$@"
