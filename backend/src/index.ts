import { env } from './env.js';
import Fastify from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerStaticRoutes } from './static.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import { SseHub } from "./overlay/sseHub.js";
import { getBraodcasterId } from './twitch/helix.js';
import { EventSubClient } from "./twitch/eventSubClient.js";
import { tokenManager } from "./twitch/tokenManager.js";
import { normalize } from "./alerts/normalize.js";
import { AlertQueue } from "./alerts/alertQueue.js";
import { GiftAggregator } from "./alerts/giftAggregator.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL } });
const hub = new SseHub();
const queue = new AlertQueue({ maxDurationMs: 8000, gapMs: 500 });

registerHealthRoutes(app);
registerStaticRoutes(app);
await app.register(authRoutes);
await app.register(eventRoutes, { hub, queue });

tokenManager.init();

if (tokenManager.status().connected) {
  const eventsub = new EventSubClient(await getBraodcasterId());

  eventsub.on("connected", (id) => app.log.info(`[eventsub] session ${id}`));
  eventsub.on("notification", (n) => {
    const alert = normalize(n);
    if (alert) gifts.add(alert);
  });
  eventsub.on("revocation", (s) => app.log.error({ s }, "[eventsub] subscription revoked"));
  eventsub.on("sub-error", (e) => app.log.error(e, "[eventsub] subscribe failed"));

  eventsub.start();
  tokenManager.on("needs-reauth", () => eventsub.stop());
}

queue.on("play", (a) => hub.broadcast("alert", a));
const gifts = new GiftAggregator(2000, (a) => queue.enqueue(a));

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
