#!/bin/sh

set -eu

log() {
    echo "[startapp] $*"
}

PORT="${PORT:-3000}"

# Secrets aren't baked into the image (see Dockerfile.jumproom) — generate them
# here on first boot and persist under /config so they survive container
# restarts (an OVERLAY_TOKEN or SESSION_SECRET that changes every restart would
# break the OBS browser source / log everyone out each time).
SECRETS_DIR=/config/.jumproom-secrets
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
    export TWITCH_CLIENT_SECRET="jumproom-placeholder-client-secret"
    log "WARNING: TWITCH_CLIENT_SECRET not set — Twitch OAuth/EventSub will not work. Pass -e TWITCH_CLIENT_ID=... -e TWITCH_CLIENT_SECRET=... for a real integration."
fi

cd /app
node backend/dist/index.js &
log "Backend server started on port $PORT (admin SPA + overlay served from the same origin)"

until curl -s "http://localhost:$PORT/health" >/dev/null 2>&1; do
    sleep 0.5
done
log "Backend is ready"
log "Overlay URL for OBS Browser Source: http://localhost:$PORT/overlay?token=$OVERLAY_TOKEN"

exec /usr/bin/google-chrome \
    --no-sandbox \
    --test-type \
    --disable-gpu \
    --disable-gpu-sandbox \
    --in-process-gpu \
    --disable-accelerated-2d-canvas \
    --remote-debugging-port=9222 \
    --remote-debugging-address=0.0.0.0 \
    --disable-features=IsolateOrigins,site-per-process \
    --user-data-dir=/config \
    --disable-dev-shm-usage \
    --no-default-browser-check \
    --disable-search-engine-choice-screen \
    --no-first-run \
    "http://localhost:$PORT"
