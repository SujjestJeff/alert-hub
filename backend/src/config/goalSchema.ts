import { z } from 'zod';

export const GOAL_METRICS = ['followers', 'subs', 'bits', 'custom'] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export const GoalSchema = z.object({
  id: z.string().min(1).max(64),
  enabled: z.boolean(),
  metric: z.enum(GOAL_METRICS),
  label: z.string().min(1).max(80),
  target: z.number().int().min(1),
  color: z.string().max(32).default('#7c3aed'),
});
export type Goal = z.infer<typeof GoalSchema>;

export type GoalState = Goal & { current: number };
