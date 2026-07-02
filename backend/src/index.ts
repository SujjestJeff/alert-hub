import { env } from './env.js';
import Fastify from 'fastify';
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { join } from "node:path";
import { registerHealthRoutes } from './health.js';
import { registerStaticRoutes } from './static.js';
import adminRoutes from "./routes/admin.js";
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import { SseHub } from "./overlay/sseHub.js";
import { getBraodcasterId } from './twitch/helix.js';
import { EventSubClient } from "./twitch/eventSubClient.js";
import { tokenManager } from "./twitch/tokenManager.js";
import { normalize } from "./alerts/normalize.js";
import { AlertQueue } from "./alerts/alertQueue.js";
import { GiftAggregator } from "./alerts/giftAggregator.js";
import { configStore } from "./config/configStore.js";
import { shouldAlert } from "./alerts/shouldAlert.js";
import { checkOverlayToken } from "./overlay/sse.js";
import { makeSyntheticAlert } from './alerts/synthetic.js';
import { AlertKind } from './config/schema.js';

function fireTest(kind: AlertKind) {
  const alert = makeSyntheticAlert(kind);
  app.log.info({ id: alert.id, kind }, "[test] synthetic alert");
  gifts.add(alert);
}

const eventsub = new EventSubClient(await getBraodcasterId());
configStore.init();
const app = Fastify({ logger: { level: env.LOG_LEVEL } });
const hub = new SseHub();
const queue = new AlertQueue({ maxDurationMs: 8000, gapMs: 500 });

if (env.NODE_ENV === "production") {
  await app.register(fastifyStatic, { root: join(process.cwd(), "overlay"), prefix: "/overlay/" });
  await app.register(fastifyStatic, { root: join(process.cwd(), "admin/dist"), prefix: "/", decorateReply: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.method === "GET" && !req.url.startsWith("/admin/api") && !req.url.startsWith("/auth")
      && !req.url.startsWith("/events") && !req.url.startsWith("/overlay")) {
      return reply.sendFile("index.html", join(process.cwd(), "admin/dist"));
    }
    reply.code(404).send({ error: "not found" });
  });
}

registerHealthRoutes(app, eventsub);
registerStaticRoutes(app);
await app.register(authRoutes);
await app.register(eventRoutes, { hub, queue });
await app.register(cookie, { secret: env.SESSION_SECRET });
await app.register(adminRoutes, { fireTest, eventsub, hub, lastEventAt: () => lastEventAt });

app.get("/overlay/config", (req, reply) => {
  const { token } = req.query as Record<string, string>;
  if (!checkOverlayToken(token)) return reply.code(401).send("unauthorized");
  return configStore.getAll();
});

tokenManager.init();

let lastEventAt: number | null = null;

if (tokenManager.status().connected) {

  eventsub.on("connected", (id) => app.log.info(`[eventsub] session ${id}`));
  eventsub.on("notification", (n) => {
    const alert = normalize(n);
    if (!alert) return;
    const cfg = configStore.getAlert(alert.kind);
    if (!cfg || !shouldAlert(alert, cfg)) return;
    gifts.add(alert);
  });
  eventsub.on("revocation", (s) => app.log.error({ s }, "[eventsub] subscription revoked"));
  eventsub.on("sub-error", (e) => app.log.error(e, "[eventsub] subscribe failed"));
  eventsub.on("notification", () => { lastEventAt = Date.now(); });

  eventsub.start();
  tokenManager.on("needs-reauth", () => eventsub.stop());
  tokenManager.on("connected", () => { if (eventsub.state === "stopped") eventsub.start(); });
}

configStore.on("changed", () => hub.broadcast("config", configStore.getAll()));

queue.on("play", (a) => hub.broadcast("alert", a));
const gifts = new GiftAggregator(2000, (a) => queue.enqueue(a));

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
