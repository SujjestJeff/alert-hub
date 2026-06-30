import type { FastifyInstance } from 'fastify'

export function registerEventRoutes(app: FastifyInstance): void {
  // Episode 4: implement SSE endpoint — stream alert events to the overlay
  app.get('/events', async (_req, reply) => {
    reply.code(501).send({ error: 'Not Implemented', message: 'SSE endpoint coming in Episode 4' })
  })
}
