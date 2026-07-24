import { describe, it, expect } from 'vitest';
import { AlertConfigSchema } from './schema.js';

const valid = {
  enabled: true,
  template: '{name}!',
  sound: null,
  image: null,
  holdMs: 3000,
  minAmount: 0,
  tiers: [],
};

describe('AlertConfigSchema', () => {
  it('accepts a valid config', () =>
    expect(() => AlertConfigSchema.parse(valid)).not.toThrow());
  it('rejects an empty template', () =>
    expect(() =>
      AlertConfigSchema.parse({ ...valid, template: '' }),
    ).toThrow());
  it('rejects out-of-range holdMs', () =>
    expect(() => AlertConfigSchema.parse({ ...valid, holdMs: 99 })).toThrow());
  it('rejects a negative threshold', () =>
    expect(() =>
      AlertConfigSchema.parse({ ...valid, minAmount: -1 }),
    ).toThrow());
  it('rejects unsorted tiers', () =>
    expect(() =>
      AlertConfigSchema.parse({
        ...valid,
        tiers: [
          { minAmount: 100, variations: ['a'] },
          { minAmount: 50, variations: ['b'] },
        ],
      }),
    ).toThrow());
  it('defaults tiers to an empty array', () =>
    expect(
      () => AlertConfigSchema.parse({ ...valid, tiers: undefined }).tiers,
    ).toEqual([]));
});
