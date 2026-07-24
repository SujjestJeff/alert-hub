import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import {
  GoalSchema,
  type Goal,
  type GoalState,
  type GoalMetric,
} from './goalSchema.js';
import type { NormalizedAlert } from '../alerts/types.js';

function contribution(
  alert: NormalizedAlert,
): { metric: GoalMetric; by: number } | null {
  switch (alert.kind) {
    case 'follow':
      return { metric: 'followers', by: 1 };
    case 'subscription':
    case 'resub':
      return { metric: 'subs', by: 1 };
    case 'gift':
      return { metric: 'subs', by: alert.count ?? 1 };
    case 'cheer':
      return { metric: 'bits', by: alert.bits ?? 0 };
    default:
      return null;
  }
}

class GoalStore extends EventEmitter {
  private goals = new Map<string, Goal>();
  private current = new Map<string, number>();

  init(): void {
    this.goals.clear();
    const rows = db.prepare('SELECT data FROM goals').all() as {
      data: string;
    }[];
    for (const row of rows) {
      const goal = GoalSchema.parse(JSON.parse(row.data));
      this.goals.set(goal.id, goal);
      if (!this.current.has(goal.id)) this.current.set(goal.id, 0);
    }
  }

  list(): GoalState[] {
    return [...this.goals.values()].map((g) => ({
      ...g,
      current: this.current.get(g.id) ?? 0,
    }));
  }

  upsert(patch: unknown): GoalState {
    const input = patch as Partial<Goal>;
    const id = input.id && this.goals.has(input.id) ? input.id : randomUUID();
    const existing = this.goals.get(id);
    const goal = GoalSchema.parse({
      id,
      enabled: true,
      metric: 'followers',
      label: 'New goal',
      target: 100,
      color: '#7c3aed',
      ...existing,
      ...input,
    });
    db.prepare('INSERT OR REPLACE INTO goals (id, data) VALUES (?, ?)').run(
      id,
      JSON.stringify(goal),
    );
    this.goals.set(id, goal);
    if (!this.current.has(id)) this.current.set(id, 0);
    this.emit('changed');
    return { ...goal, current: this.current.get(id) ?? 0 };
  }

  remove(id: string): void {
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    this.goals.delete(id);
    this.current.delete(id);
    this.emit('changed');
  }

  setCurrent(id: string, value: number): void {
    if (!this.goals.has(id)) return;
    this.current.set(id, Math.max(0, Math.floor(value)));
    this.emit('changed');
  }

  reset(id: string): void {
    this.setCurrent(id, 0);
  }

  applyAlert(alert: NormalizedAlert): void {
    const c = contribution(alert);
    if (!c) return;
    let moved = false;
    for (const goal of this.goals.values()) {
      if (goal.enabled && goal.metric === c.metric) {
        this.current.set(goal.id, (this.current.get(goal.id) ?? 0) + c.by);
        moved = true;
      }
    }
    if (moved) this.emit('changed');
  }
}

export const goalStore = new GoalStore();
