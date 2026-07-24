import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db.js';
import { configStore } from './configStore.js';

beforeEach(() => {
  db.exec(`DELETE FROM alert_config; DELETE FROM settings;`);
  configStore.init();
});

describe('ConfigStore persistence', () => {
  it('seeds defaults on init', () => {
    expect(configStore.getAlert('follow')?.template).toContain('followed');
  });

  it('updates and persists an alert (survives a reload)', () => {
    configStore.updateAlert('follow', { template: 'new {name}!' });
    const reloaded = new (Object.getPrototypeOf(configStore).constructor)();
    reloaded.init();
    expect(reloaded.getAlert('follow').template).toBe('new {name}!');
  });

  it('rejects an invalid update without persisting', () => {
    expect(() => configStore.updateAlert('follow', { holdMs: 5 })).toThrow();
    expect(configStore.getAlert('follow')?.holdMs).not.toBe(5);
  });

  it('migrates a legacy template row to variations on read', () => {
    db.prepare(`DELETE FROM alert_config WHERE kind = 'follow'`).run();
    db.prepare(`INSERT INTO alert_config (kind, data) VALUES ('follow, ?)`).run(
      JSON.stringify({
        enabled: true,
        template: 'legacy {name}!',
        sound: null,
        image: null,
        holdMs: 3000,
        minAmount: 0,
      }),
    );
    const reloaded = new (Object.getPrototypeOf(configStore).constructor)();
    reloaded.init();
    expect(reloaded.getAlert('follow').variations).toEqual(['legacy {name}!']);
    expect(reloaded.getAlert('follow').tiers).toEqual([]);
  });
});
