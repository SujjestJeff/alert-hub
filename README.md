# Alert-hub 🎉

A self-hosted, open-source Twitch alert box you actually own. Follows, subs, gifts, bits, raids — animated on your stream, configured from a little web panel, running entirely on your own machine in one Docker container.

No third-party overlay service. No account on someone else's site. No "we've updated our terms" email six months from now. Your tokens, your config, your box.

---

## What it does

- 🔔 Alerts for **follows, subs, resubs, gift subs, cheers, and raids**
- 🎨 Per-alert **text templates, sounds, styling, and display timing**, all editable in a web panel
- 👀 A **live preview** so you can tune alerts without begging a friend to follow you five times
- 🧪 **Test-fire** any alert straight to OBS — no waiting for a real event
- 🎚️ **Thresholds** so a 1-bit cheer doesn't get the same fanfare as 10,000
- 🔌 Talks to Twitch over **EventSub WebSockets**, so there's no public server to expose — it runs happily behind your home router
- 🐳 **One container, one port**, one `docker compose up`

## What it doesn't do

- It doesn't phone home. There's no telemetry, no analytics, no mothership.
- It doesn't sell your data, because there's nobody to sell it to. It's just you.
- It won't read your chat's cursed opinions aloud. That's a *you* problem, and a different project.

---

## Requirements

- **Docker** (the easy path), or **Node.js 20+** if you want to run from source
- A **Twitch account** (the one you stream from)
- **OBS** (or any broadcaster software with a Browser Source)
- Roughly five minutes and the ability to copy-paste a URL exactly. That last part is load-bearing.

---

## Quick start (Docker)

```bash
git clone https://github.com/SujjestJeff/alert-hub.git
cd alertbox
cp .env.example .env
# open .env and fill it in — see Configuration below
docker compose up -d
```

Then, in order:

1. Visit **http://localhost:3000/auth/login** once and authorize with Twitch.
2. Add the **overlay** to OBS (see below).
3. Open the **admin panel** at **http://localhost:3000/**, log in, and make your alerts look good.

That's it. Fire a test alert from the panel and watch it land in OBS.

---

## Register your own Twitch app

Because this is *your* box, it uses *your* Twitch application credentials. One-time setup:

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) → **Register Your Application**.
2. Name it whatever (Twitch won't let two apps share a name globally, so "Alert Box" is taken — get creative).
3. Set the **OAuth Redirect URL** to **exactly** this:
   ```
   http://localhost:3000/auth/callback
   ```
4. Category: *Application Integration*. Create it.
5. Copy the **Client ID**, then **New Secret** and copy that too.
6. Paste both into your `.env`.

> ⚠️ **The #1 setup failure lives here.** The Redirect URL must match `TWITCH_REDIRECT_URI` character-for-character — same scheme (`http`), host, port, and path, no trailing slash surprises. If Twitch throws `redirect_mismatch` at you during login, it's this. It's always this. Check it before you check anything else.

---

## Configuration

Copy `.env.example` to `.env` and fill it in.

| Variable | Required | What it's for |
|---|---|---|
| `PORT` | no | Port to serve on. Default `3000`. |
| `DATABASE_PATH` | no | Where SQLite lives. In Docker this is `/data/alertbox.db` (on the volume). |
| `TWITCH_CLIENT_ID` | **yes** | From your Twitch app. |
| `TWITCH_CLIENT_SECRET` | **yes** | From your Twitch app. Keep it secret. Keep it safe. |
| `TWITCH_REDIRECT_URI` | **yes** | Must match your app's Redirect URL exactly. |
| `TWITCH_BROADCASTER_LOGIN` | **yes** | Your channel login name (the one in your URL, lowercase). |
| `ADMIN_PASSWORD` | **yes** | Password for the config panel. Make it not-`password`. |
| `SESSION_SECRET` | **yes** | Random string used to sign the admin login cookie. |
| `OVERLAY_TOKEN` | **yes** | Random string that gates your overlay URL so randos can't hijack it. |
| `EVENTSUB_WS_URL` | no | Only for pointing at the Twitch CLI mock server during development. Leave it unset. |
| `NODE_ENV` | no | `production` in Docker. Also flips the login cookie to `secure`. |

Generate the random ones however you like; this works:

```bash
openssl rand -hex 32
```

> Leave `OVERLAY_TOKEN` and `SESSION_SECRET` empty and things will refuse to work on purpose — the overlay fails closed and login can't sign a cookie. That's a feature. Fill them in.

---

## Add the overlay to OBS

1. In OBS: **Sources → + → Browser**.
2. **URL:**
   ```
   http://localhost:3000/overlay?token=YOUR_OVERLAY_TOKEN
   ```
   (yes, the same `OVERLAY_TOKEN` from your `.env` — that's what keeps strangers from firing fake alerts on your stream)
3. Set **Width/Height** to your canvas (e.g. 1920 × 1080).
4. **Uncheck** "Shutdown source when not visible" so the connection stays alive.
5. To hear alerts on stream, open the source's properties and enable **Control Audio via OBS**.

Changed some overlay code and nothing updated? OBS caches like a dragon hoards gold — right-click the source → **Refresh cache of current page**.

---

## Configure your alerts

Open **http://localhost:3000/** and log in with `ADMIN_PASSWORD`.

For each alert type you get: an **enable** toggle, a **text template**, a **sound URL**, a **hold time**, and a **minimum threshold**. Templates support variables:

- `{name}` — who did the thing
- `{count}` — gift count / raid party size
- `{tier}` — sub tier
- `{bits}` — bits cheered
- `{months}` — resub months

So `"{name} raided with {count}!"` becomes `"BigStreamer raided with 300!"`.

Two buttons per alert:

- **Preview (draft)** — renders your *unsaved* changes instantly in the panel. Muted, because tuning a template shouldn't blast the sub sound at you forty times.
- **Fire test (live → OBS)** — pushes a fake event through the *real* pipeline, so it shows up in the preview *and* on your actual stream, exactly like the real thing. Save first; this uses saved config.

Changes apply live — no restart, no refresh. Tweak a sound, fire a test, hear the difference.

---

## Running from source (dev)

```bash
npm install
npm run dev
```

- Backend + API: **http://localhost:3000**
- Admin (Vite dev server, hot reload): **http://localhost:5173**
- Overlay: served by the backend at `/overlay`

Run the tests with `npm test`. There are a lot of them, mostly guarding the boring-but-fatal stuff (token refresh, the gift-sub double-count, reconnect backoff) — the bugs that work fine for four hours and then die live on stream.

---

## Supported alerts & the scopes behind them

The one-time Twitch authorization requests exactly what it needs and nothing more:

| Alert | Twitch scope |
|---|---|
| Follows | `moderator:read:followers` |
| Subs / resubs / gift subs | `channel:read:subscriptions` |
| Cheers (bits) | `bits:read` |
| Raids | *(none needed)* |

If you don't care about one of these, you can leave that alert disabled in the panel. The scopes are still requested at login, but nothing's forcing you to use them.

---

## Behind a reverse proxy

Running this behind nginx (e.g. to slap a real domain and HTTPS on it)? The alert stream uses Server-Sent Events, which nginx will happily buffer into uselessness unless you tell it not to:

```nginx
location /events {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_buffering off;      # without this, alerts arrive in awkward clumps
  proxy_read_timeout 1h;    # it's a long-lived stream; don't guillotine it
}
```

And once you're on HTTPS, set `NODE_ENV=production` so the admin cookie goes `secure`. (On plain `http://localhost` a `secure` cookie is silently never sent, and login mysteriously "doesn't work" — which is the second most common setup faceplant.)

---

## Troubleshooting

**No alerts showing up.** Check the status bar at the top of the admin panel — three dots tell you whether **Twitch**, **EventSub**, and your **overlay** are each connected. Also hit `http://localhost:3000/health` for a quick pulse. If Twitch is red, your token probably expired — click **Reconnect Twitch**.

**Alerts fire but there's no sound.** Enable **Control Audio via OBS** on the browser source. If the *first* alert of a session is silent but the rest are fine, that's OBS not preloading — it usually sorts itself out after the first one; a source refresh helps.

**`redirect_mismatch` at login.** Your Twitch app's Redirect URL doesn't exactly match `TWITCH_REDIRECT_URI`. See the big warning above. It's this.

**Login just bounces me back.** Almost always the `secure` cookie on `http`. Confirm `NODE_ENV` isn't `production` when you're on plain localhost.

**I hard-killed the container mid-stream.** It's fine. `docker compose up` again — tokens and config live on the Docker volume, and it reconnects to Twitch on its own. No re-login, no re-config.

---

## How it works (for the curious)

A Node/TypeScript backend holds your Twitch tokens (refreshing them before they expire), keeps a WebSocket open to Twitch EventSub, normalizes the incoming events, and pushes them through a queue that plays alerts one at a time. The overlay is a dumb browser page that receives alerts over Server-Sent Events and animates them. The React admin panel writes your config to SQLite and pushes changes live to the overlay. Everything's one container serving one port.

It's deliberately small and readable — if you want to add an alert type or a fancier animation, the code won't fight you.

---

## Contributing

PRs welcome. It's a self-host tool, so the bar is: does it stay simple, and does it survive a real stream? Tests appreciated, especially around anything touching tokens or reconnects.

## License

MIT
---

*Built live, on stream, mostly by hand. If it drops an alert at the worst possible moment, that's not a bug, it's content.* 📺
