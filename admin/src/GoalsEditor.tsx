import { useEffect, useState } from 'react';
import { Target, Plus, Trash2, RotateCcw, Copy } from 'lucide-react';
import {
  getGoals,
  saveGoal,
  deleteGoal,
  setGoalCurrent,
  getOverlayToken,
} from './api';

const METRICS = ['followers', 'subs', 'bits', 'custom'] as const;

export function GoalsEditor() {
  const [goals, setGoals] = useState<any[]>([]);
  const [token, setToken] = useState('');

  const load = async () => setGoals(await getGoals());

  useEffect(() => {
    load();
    getOverlayToken().then((t) => setToken(t.token));
  }, []);

  const onSave = async (patch: any) => {
    await saveGoal(patch);
    await load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold text-foreground mb-1"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Goal Bars
          </h2>
          <p className="text-sm text-muted-foreground">
            Persistent progress bars — add each as its own OBS browser source
          </p>
        </div>
        <button
          onClick={() =>
            onSave({ label: 'New goal', metric: 'followers', target: 100 })
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
            bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
        >
          <Plus size={14} /> New goal
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            token={token}
            onSave={onSave}
            onDelete={load}
          />
        ))}
        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No goals yet — create one above.
          </p>
        )}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  token,
  onSave,
  onDelete,
}: {
  goal: any;
  token: string;
  onSave: (patch: any) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(goal);
  const set = (patch: any) => setDraft({ ...draft, ...patch });
  const url = `${location.origin}/overlay/?widget=goals&token=${encodeURIComponent(token)}`;
  const pct = Math.min(
    100,
    goal.target > 0 ? (goal.current / goal.target) * 100 : 0,
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-primary" />
        <input
          value={draft.label}
          onChange={(e) => set({ label: e.target.value })}
          className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm"
        />
        <button
          onClick={async () => {
            await deleteGoal(goal.id);
            onDelete();
          }}
          className="text-muted-foreground hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground uppercase tracking-wider">
          Metric
          <select
            value={draft.metric}
            onChange={(e) => set({ metric: e.target.value })}
            className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          >
            {METRICS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground uppercase tracking-wider">
          Target
          <input
            type="number"
            value={draft.target}
            onChange={(e) => set({ target: Number(e.target.value) })}
            className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground uppercase tracking-wider">
          Color
          <input
            type="color"
            value={draft.color ?? '#7c3aed'}
            onChange={(e) => set({ color: e.target.value })}
            className="h-9 bg-secondary/50 border border-border rounded-xl px-1"
          />
        </label>
      </div>

      {/* live bar */}
      <div className="h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: draft.color }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {goal.current} / {goal.target}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave({ ...draft, id: goal.id })}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30"
        >
          Save
        </button>
        <button
          onClick={async () => {
            await setGoalCurrent(goal.id, goal.current + 1);
            onDelete();
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-secondary/50 border border-border"
        >
          <Plus size={13} /> Simulate
        </button>
        <button
          onClick={async () => {
            await setGoalCurrent(goal.id, 0);
            onDelete();
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-secondary/50 border border-border"
        >
          <RotateCcw size={13} /> Reset
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          title={url}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-secondary/50 border border-border ml-auto"
        >
          <Copy size={13} /> Copy OBS URL
        </button>
      </div>
    </div>
  );
}
