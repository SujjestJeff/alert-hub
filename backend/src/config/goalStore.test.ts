import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db.js';
import { goalStore } from './goalStore.js';
import type { NormalizedAlert } from '../alerts/types.js';

const alert = (over: Partial<NormalizedAlert>): NormalizedAlert => ({
  id: 'x',
  kind: 'follow',
  displayName: 'A',
  createdAt: 0,
  ...over,
});

beforeEach(() => {
  db.exec('DELETE FROM goals;');
  goalStore.init();
});

describe('GoalStore', () => {
  it('creates and persists a goal', () => {
    const g = goalStore.upsert({
      metric: 'subs',
      label: 'Sub goal',
      target: 50,
    });
    const reloaded = new (Object.getPrototypeOf(goalStore).constructor)();
    reloaded.init();
    expect(reloaded.list().find((x: any) => x.id === g.id)?.label).toBe(
      'Sub goal',
    );
  });

  it('increments matching goals from alerts', () => {
    const g = goalStore.upsert({ metric: 'subs', label: 'Subs', target: 100 });
    goalStore.applyAlert(alert({ kind: 'subscription' }));
    goalStore.applyAlert(alert({ kind: 'gift', count: 5 }));
    expect(goalStore.list().find((x) => x.id === g.id)?.current).toBe(6);
  });

  it('ignores non-matching metrics', () => {
    const g = goalStore.upsert({ metric: 'bits', label: 'Bits', target: 1000 });
    goalStore.applyAlert(alert({ kind: 'follow' }));
    expect(goalStore.list().find((x) => x.id === g.id)?.current).toBe(0);
  });

  it('honors manual set and reset', () => {
    const g = goalStore.upsert({ metric: 'followers', label: 'F', target: 10 });
    goalStore.setCurrent(g.id, 7);
    expect(goalStore.list()[0].current).toBe(7);
    goalStore.reset(g.id);
    expect(goalStore.list()[0].current).toBe(0);
  });
});
