import { env } from './env.js';
import Fastify from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerStaticRoutes } from './static.js';
import authRoutes from './routes/auth.js';
import { registerEventRoutes } from './routes/events.js';
import { getBraodcasterId } from './twitch/helix.js';
import { EventSubClient } from "./twitch/eventSubClient.js";
import { tokenManager } from "./twitch/tokenManager.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL } });

registerHealthRoutes(app);
registerEventRoutes(app);
registerStaticRoutes(app);
await app.register(authRoutes);

tokenManager.init();

if (tokenManager.status().connected) {
  const eventsub = new EventSubClient(await getBraodcasterId());

  eventsub.on("connected", (id) => app.log.info(`[eventsub] session ${id}`));
  eventsub.on("notification", (n) => app.log.info({ n }, `[eventsub] ${n.subscriptionType}`));
  eventsub.on("revocation", (s) => app.log.error({ s }, "[eventsub] subscription revoked"));
  eventsub.on("sub-error", (e) => app.log.error(e, "[eventsub] subscribe failed"));

  eventsub.start();
  tokenManager.on("needs-reauth", () => eventsub.stop());
}


try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
