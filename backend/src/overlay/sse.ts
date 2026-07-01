import { timingSafeEqual } from "node:crypto";
import { env } from "../env.js";

export function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function tokensMatch(provided: unknown, expected: string | undefined): boolean {
  if (typeof provided !== "string" || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkOverlayToken(token: unknown): boolean {
  return tokensMatch(token, env.OVERLAY_TOKEN);
}
