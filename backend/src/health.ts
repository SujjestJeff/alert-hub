import type { FastifyInstance } from 'fastify'
import { tokenManager } from './twitch/tokenManager.js';

export function registerHealthRoutes(app: FastifyInstance, eventsub: any): void {
  app.get('/health', async () => ({
    ok: true,
    twitch: tokenManager.status().connected,
    eventsub: eventsub.state,
  }));
}
