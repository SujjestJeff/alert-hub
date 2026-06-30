import { config } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Load .env from the project root regardless of which directory the process starts in
const _dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(_dirname, '../../.env') })

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    console.error(`FATAL: environment variable ${key} is required but not set`)
    process.exit(1)
  }
  return val
}

// Episode 1+ vars are optional at boot — warn once, then continue
const episodeVars = [
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_REDIRECT_URI',
  'TWITCH_BROADCASTER_LOGIN',
  'ADMIN_PASSWORD',
  'SESSION_SECRET',
  'OVERLAY_TOKEN',
]
const missing = episodeVars.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.warn(
    `[startup] Not set (required in later episodes): ${missing.join(', ')}`,
  )
}

export const env = {
  PORT: parseInt(requireEnv('PORT'), 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  DATABASE_PATH: requireEnv('DATABASE_PATH'),
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
  TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI,
  TWITCH_BROADCASTER_LOGIN: process.env.TWITCH_BROADCASTER_LOGIN,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  OVERLAY_TOKEN: process.env.OVERLAY_TOKEN,
} as const
