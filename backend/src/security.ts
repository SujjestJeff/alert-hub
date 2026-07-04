import { timingSafeEqual } from 'crypto';

export function tokensMatch(
  provided: unknown,
  expected: string | undefined,
): boolean {
  if (typeof provided !== 'string' || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
