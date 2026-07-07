import { env } from './env.js';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { registerHealthRoutes } from './health.js';
import { registerStaticRoutes } from './static.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import overlayRoutes from './routes/overlay.js';
import { SseHub } from './overlay/sseHub.js';
import { getBroadcasterId } from './twitch/helix.js';
import { EventSubClient } from './twitch/eventSubClient.js';
import { tokenManager } from './twitch/tokenManager.js';
import { normalize } from './alerts/normalize.js';
import { AlertQueue } from './alerts/alertQueue.js';
import { GiftAggregator } from './alerts/giftAggregator.js';
import { configStore } from './config/configStore.js';
import { shouldAlert } from './alerts/shouldAlert.js';
import { makeSyntheticAlert } from './alerts/synthetic.js';
import { AlertKind } from './config/schema.js';

const eventsub = new EventSubClient(() => getBroadcasterId());
const app = Fastify({ logger: { level: env.LOG_LEVEL } });
const hub = new SseHub();
let lastEventAt: number | null = null;

tokenManager.init();
configStore.init();

const configSettings = configStore.getSettings();
const queue = new AlertQueue({
  maxDurationMs: configSettings.maxDurationMs,
  gapMs: configSettings.gapMs,
});
const gifts = new GiftAggregator(configSettings.aggregationWindowMs, (a) =>
  queue.enqueue(a),
);

configStore.on('changed', () => {
  hub.broadcast('config', configStore.getAll());
  const settings = configStore.getSettings();
  queue.updateOptions({
    maxDurationMs: settings.maxDurationMs,
    gapMs: settings.gapMs,
  });
  gifts.updateWindowMs(settings.aggregationWindowMs);
});

queue.on('play', (a) => hub.broadcast('alert', a));

function fireTest(kind: AlertKind) {
  const alert = makeSyntheticAlert(kind);
  app.log.info({ id: alert.id, kind }, '[test] synthetic alert');
  gifts.add(alert);
}

registerStaticRoutes(app);
registerHealthRoutes(app, eventsub);
await app.register(authRoutes);
await app.register(eventRoutes, { hub, queue });
await app.register(cookie, { secret: env.SESSION_SECRET });
await app.register(adminRoutes, {
  fireTest,
  eventsub,
  hub,
  lastEventAt: () => lastEventAt,
});
await app.register(overlayRoutes);

eventsub.on('connected', (id) => app.log.info(`[eventsub] session ${id}`));
eventsub.on('notification', (n) => {
  const alert = normalize(n);
  if (!alert) return;
  const cfg = configStore.getAlert(alert.kind);
  if (!cfg || !shouldAlert(alert, cfg)) return;
  gifts.add(alert);
});
eventsub.on('revocation', (s) =>
  app.log.error({ s }, '[eventsub] subscription revoked'),
);
eventsub.on('sub-error', (e) =>
  app.log.error(e, '[eventsub] subscribe failed'),
);
eventsub.on('notification', () => {
  lastEventAt = Date.now();
});

tokenManager.on('needs-reauth', () => eventsub.stop());
tokenManager.on('connected', () => {
  if (eventsub.state === 'stopped') eventsub.start();
});
if (tokenManager.status().connected) {
  eventsub.start();
}

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
