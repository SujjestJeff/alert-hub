import { describe, it, expect } from 'vitest';
import { clampPct } from './goals.js';

describe('clampPct', () => {
  it('is 0 at zero and 100 at target', () => {
    expect(clampPct(0, 50)).toBe(0);
    expect(clampPct(50, 50)).toBe(100);
  });
  it('clamps overshoot to 100', () => {
    expect(clampPct(120, 50)).toBe(100);
  });
  it('handles a zero target safely', () => {
    expect(clampPct(5, 0)).toBe(0);
  });
});
