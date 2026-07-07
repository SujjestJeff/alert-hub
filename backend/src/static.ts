import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const _dirname = dirname(fileURLToPath(import.meta.url));

export function registerStaticRoutes(app: FastifyInstance): void {
  // Overlay — always served; add this URL as a Browser Source in OBS
  const overlayRoot = join(_dirname, `../../overlay/`);
  app.register(fastifyStatic, { root: overlayRoot, prefix: '/overlay' });

  // Admin SPA — present in the Docker image (built by Dockerfile.backend)
  // Not available in local dev (admin runs separately on :5173 via Vite)
  const adminDist = join(_dirname, '../../admin/dist');
  if (existsSync(adminDist)) {
    app.register(fastifyStatic, {
      root: adminDist,
      prefix: '/',
      decorateReply: false,
    });
    app.setNotFoundHandler((req, reply) => {
      if (
        req.method === 'GET' &&
        !req.url.startsWith(`/admin/api`) &&
        !req.url.startsWith(`/auth`) &&
        !req.url.startsWith(`/events`) &&
        !req.url.startsWith(`/overlay`)
      ) {
        return reply.sendFile(`index.html`, adminDist);
      }
      reply.code(404).send({ error: `not found` });
    });
  }
}
