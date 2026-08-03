import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Load .env from the project root regardless of which directory the process starts in
const _dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(_dirname, '../../.env') });

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string(),
  TWITCH_CLIENT_ID: z.string().min(1),
  TWITCH_CLIENT_SECRET: z.string().min(1),
  TWITCH_REDIRECT_URI: z.string().url(),
  TWITCH_BROADCASTER_LOGIN: z.string().optional(),
  LOG_LEVEL: z.string().default('INFO'),
  EVENTSUB_WS_URL: z.string().url().optional(),
  OVERLAY_TOKEN: z.string(),
  SESSION_SECRET: z.string(),
  ADMIN_PASSWORD: z.string(),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    '[env] invalid configuration:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
