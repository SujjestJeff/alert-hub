import type { FastifyInstance } from 'fastify';
import { checkOverlayToken } from '../overlay/sse.js';
import { configStore } from '../config/configStore.js';
import { goalStore } from '../config/goalStore.js';

export default async function overlayRoutes(app: FastifyInstance) {
  app.get('/overlay/config', (req, reply) => {
    const { token } = req.query as Record<string, string>;
    if (!checkOverlayToken(token)) return reply.code(401).send('unauthorized');
    return configStore.getAll();
  });

  app.get('/overlay/goals', (req, reply) => {
    const { token } = req.query as Record<string, string>;
    if (!checkOverlayToken(token)) return reply.code(401).send('unauthorized');
    return { goals: goalStore.list() };
  });
}
