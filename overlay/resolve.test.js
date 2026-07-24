import { describe, it, expect } from 'vitest';
import { magnitudeOf, resolveAlert } from './resolve.js';

const cheerCfg = {
  variations: ['base {bits}'],
  sound: 'base.ogg',
  holdMs: 3000,
  tiers: [
    {
      minAmount: 1000,
      variations: ['HYPE {bits}'],
      holdMs: 5000,
      cssClass: 'tier-hype',
    },
  ],
};

describe('resolveAlert', () => {
  it('maps magnitude per kind', () => {
    expect(magnitudeOf('cheer', { bits: 50 })).toBe(500);
    expect(magnitudeOf('raid', { count: 40 })).toBe(40);
    expect(magnitudeOf('follow', {})).toBeNull();
  });

  it('falls back to base config below any tier', () => {
    const r = resolveAlert('cheer', cheerCfg, { bits: 100 });
    expect(r.template).toBe('base {bits}');
    expect(r.holdMs).toBe(3000);
    expect(r.cssClass).toBe('cheer');
  });

  it('applies the highest matching tier and inherits unset fields', () => {
    const r = resolveAlert('cheer', cheerCfg, { bits: 5000 });
    expect(r.template).toBe('HYPE {bits}');
    expect(r.holdMs).toBe(5000);
    expect(r.sound).toBe('base.ogg');
    expect(r.cssClass).toBe('cheer tier-hype');
  });
});
