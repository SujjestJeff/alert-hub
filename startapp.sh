#!/bin/sh

set -eu

log() {
    echo "[startapp] $*"
}

serve -s /app/dist -l 3000 &
log "React app server started on port 3000"

until curl -s http://localhost:3000 >/dev/null 2>&1; do
    sleep 0.5
done
log "React app is ready"

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
    http://localhost:3000
