import { env } from './env.js'
import Fastify from 'fastify'
import { registerHealthRoutes } from './health.js'
import { registerStaticRoutes } from './static.js'
import authRoutes from './routes/auth.js'
import { registerEventRoutes } from './routes/events.js'

const app = Fastify({ logger: { level: env.LOG_LEVEL } });

registerHealthRoutes(app);
registerEventRoutes(app);
registerStaticRoutes(app);
await app.register(authRoutes);

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
