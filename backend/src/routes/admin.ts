import type { FastifyInstance } from 'fastify';
import type { EventSubClient } from '../twitch/eventSubClient.js';
import type { SseHub } from '../overlay/sseHub.js';
import { env } from '../env.js';
import { configStore } from '../config/configStore.js';
import { ALERT_KINDS, type AlertKind } from '../config/schema.js';
import { requireAdmin, ADMIN_COOKIE } from './adminAuth.js';
import { makeStatusSnapshot } from '../status/statusService.js';
import { tokensMatch } from '../security.js';
import { goalStore } from '../config/goalStore.js';

interface AdminRoutesOpts {
  fireTest: (kind: AlertKind, amount?: number) => void;
  eventsub: EventSubClient;
  hub: SseHub;
  lastEventAt: () => number | null;
}

function passwordOk(input: unknown): boolean {
  return tokensMatch(input, env.ADMIN_PASSWORD);
}

export default async function adminRoutes(
  app: FastifyInstance,
  opts: AdminRoutesOpts,
) {
  app.post('/admin/login', async (req, reply) => {
    const { password } = (req.body ?? {}) as { password?: string };
    if (!passwordOk(password))
      return reply.code(401).send({ error: 'bad password' });
    reply.setCookie(ADMIN_COOKIE, String(Date.now()), {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: env.COOKIE_SECURE,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true };
  });

  app.post('/admin/logout', async (_req, reply) => {
    reply.clearCookie(ADMIN_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/admin/api/config', { preHandler: requireAdmin }, async () =>
    configStore.getAll(),
  );

  app.put(
    '/admin/api/config/:kind',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { kind } = req.params as { kind: string };
      if (!ALERT_KINDS.includes(kind as AlertKind))
        return reply.code(404).send({ error: 'unknown kind' });
      try {
        return configStore.updateAlert(kind as AlertKind, req.body);
      } catch (err) {
        return reply
          .code(400)
          .send({ error: 'invalid config', detail: String(err) });
      }
    },
  );

  app.put(
    '/admin/api/settings',
    { preHandler: requireAdmin },
    async (req, reply) => {
      try {
        return configStore.updateSettings(req.body);
      } catch (err) {
        return reply
          .code(400)
          .send({ error: 'invalid settings', detail: String(err) });
      }
    },
  );

  app.get(
    '/admin/api/overlay-token',
    { preHandler: requireAdmin },
    async () => ({ token: env.OVERLAY_TOKEN ?? '' }),
  );

  app.post(
    '/admin/api/test-alert',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { kind, amount } = (req.body ?? {}) as {
        kind?: string;
        amount?: number;
      };
      if (!kind || !ALERT_KINDS.includes(kind as AlertKind))
        return reply.code(400).send({ error: 'unknown kind' });
      opts.fireTest(
        kind as AlertKind,
        typeof amount === 'number' ? amount : undefined,
      );
      return { ok: true };
    },
  );

  app.get('/admin/api/status', { preHandler: requireAdmin }, async () =>
    makeStatusSnapshot(opts.eventsub, opts.hub, opts.lastEventAt()),
  );

  app.get('/admin/api/goals', { preHandler: requireAdmin }, async () =>
    goalStore.list(),
  );

  app.put(
    '/admin/api/goals',
    { preHandler: requireAdmin },
    async (req, reply) => {
      try {
        return goalStore.upsert(req.body);
      } catch (err) {
        return reply
          .code(400)
          .send({ error: 'invalid goal', detail: String(err) });
      }
    },
  );

  app.delete(
    '/admin/api/goals/:id',
    { preHandler: requireAdmin },
    async (req) => {
      goalStore.remove((req.params as { id: string }).id);
      return { ok: true };
    },
  );

  app.post(
    '/admin/api/goals/:id/current',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { value } = (req.body ?? {}) as { value?: number };
      if (typeof value !== 'number')
        return reply.code(400).send({ error: 'value required' });
      goalStore.setCurrent(id, value);
      return { ok: true };
    },
  );
}
