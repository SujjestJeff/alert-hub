export interface BackoffOptions { base?: number; max?: number; factor?: number; jitter?: number }

export function createBackoff({ base = 1_000, max = 60_000, factor = 2, jitter = 0.2 }: BackoffOptions = {}) {
  let current = base;
  return {
    next(): number {
      const delay = Math.min(current, max);
      const withJitter = delay + Math.random() * jitter * delay;
      current = Math.min(current * factor, max);
      return withJitter;
    },
    reset(): void { current = base; },
    get peek(): number { return current; },
  };
}
