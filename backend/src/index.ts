import { env } from './env.js'
import Fastify from 'fastify'
import { openDatabase } from './db.js'
import { registerHealthRoutes } from './health.js'
import { registerStaticRoutes } from './static.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerEventRoutes } from './routes/events.js'

const app = Fastify({ logger: { level: env.LOG_LEVEL } })

openDatabase(env.DATABASE_PATH)

registerHealthRoutes(app)
registerAuthRoutes(app)
registerEventRoutes(app)
registerStaticRoutes(app)

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
