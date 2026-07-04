import { env } from '../env.js';
import { tokensMatch } from '../security.js';

export function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function checkOverlayToken(token: unknown): boolean {
  return tokensMatch(token, env.OVERLAY_TOKEN);
}
