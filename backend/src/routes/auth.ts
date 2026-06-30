import type { FastifyInstance } from 'fastify'

export function registerAuthRoutes(app: FastifyInstance): void {
  // Episode 1: implement OAuth flow — exchange code for tokens, store refresh token
  app.get('/auth/login', async (_req, reply) => {
    reply.code(501).send({ error: 'Not Implemented', message: 'OAuth flow coming in Episode 1' })
  })
}
