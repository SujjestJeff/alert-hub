import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Heart,
  Star,
  RefreshCw,
  Gift,
  Zap,
  Swords,
  ChevronDown,
  ChevronUp,
  Save,
  Eye,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { saveAlert, fireTestAlert } from './api';

const KINDS = [
  'follow',
  'subscription',
  'resub',
  'gift',
  'cheer',
  'raid',
] as const;
type Kind = (typeof KINDS)[number];

type KindMeta = {
  label: string;
  icon: ReactNode;
  color: string;
  glow: string;
  bg: string;
};

const KIND_META: Record<Kind, KindMeta> = {
  follow: {
    label: 'Follow',
    icon: <Heart size={16} />,
    color: 'text-pink-400',
    glow: 'shadow-[0_0_12px_rgba(244,114,182,0.4)]',
    bg: 'bg-pink-500/10 border-pink-500/25',
  },
  subscription: {
    label: 'Subscription',
    icon: <Star size={16} />,
    color: 'text-yellow-400',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
    bg: 'bg-yellow-500/10 border-yellow-500/25',
  },
  resub: {
    label: 'Resub',
    icon: <RefreshCw size={16} />,
    color: 'text-cyan-400',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.4)]',
    bg: 'bg-cyan-500/10 border-cyan-500/25',
  },
  gift: {
    label: 'gift',
    icon: <Gift size={16} />,
    color: 'text-purple-400',
    glow: 'shadow-[0_0_12px_rgba(192,132,252,0.4)]',
    bg: 'bg-purple-500/10 border-purple-500/25',
  },
  cheer: {
    label: 'cheer',
    icon: <Zap size={16} />,
    color: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]',
    bg: 'bg-blue-500/10 border-blue-500/25',
  },
  raid: {
    label: 'raid',
    icon: <Swords size={16} />,
    color: 'text-orange-400',
    glow: 'shadow-[0_0_12px_rgba(251,146,60,0.4)]',
    bg: 'bg-orange-500/10 border-orange-500/25',
  },
};

export function ConfigEditor({
  config,
  onChange,
  previewRef,
}: {
  config: any;
  onChange: (c: any) => void;
  previewRef: any;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Alert Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Customize messages, sounds, and timing for each event type
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {[0, 1].map((col) => (
          <div key={col} className="flex flex-1 flex-col gap-4">
            {KINDS.filter((_, i) => i % 2 === col).map((k) => (
              <AlertCard
                key={k}
                kind={k}
                value={config.alerts[k]}
                onSaved={(next: any) =>
                  onChange({
                    ...config,
                    alerts: { ...config.alerts, [k]: next },
                  })
                }
                previewRef={previewRef}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  kind,
  value,
  onSaved,
  previewRef,
}: {
  kind: Kind;
  value: any;
  onSaved: (v: any) => void;
  previewRef: any;
}) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const meta = KIND_META[kind];

  const set = (patch: any) => setDraft({ ...draft, ...patch });

  async function save() {
    setStatus('saving');
    try {
      const next = await saveAlert(kind, draft);
      onSaved(next);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-card transition-all duration-200
        overflow-hidden ${
          draft.enabled ? meta.bg.split(' ')[1] : 'border-border opacity-70;'
        }`}
    >
      <div
        className="flex items-center justify-between px-5 py-4
          cursor-pointer group"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center
              border ${meta.bg} ${meta.color} ${
                draft.enabled ? meta.glow : ''
              } transition-all`}
          >
            {meta.icon}
          </div>
          <div>
            <h3
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {meta.label}
            </h3>
            {!expanded && draft.template && (
              <p className="text-xs text-muted-foreground truncate max-x-[180px]">
                {draft.template}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              set({ enabled: !draft.enabled });
            }}
            className={`relative w-10 h-5 rounded-full transition-all
              duration-200 ${
                draft.enabled
                  ? 'bg-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                  : 'bg-secondary'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full
                bg-white transition-all duration-200 shadow-sm ${
                  draft.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4 flex flex-col gap-4">
          <Field label="Template">
            <input
              value={draft.template}
              onChange={(e) => set({ template: e.target.value })}
              placeholder="{username} just followed!"
              className="w-full bg-secondary/50 border border-border
                rounded-xl px-3 py-2.5 text-sm text-foreground
                placehodler:text-muted-foreground/40 focus:outline-none
                focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                transition-all"
            />
          </Field>

          <Field label="Sound URL">
            <input
              value={draft.sound ?? ''}
              onChange={(e) => set({ sound: e.target.value })}
              placeholder="https://.../sound.mp3"
              className="w-full bg-secondary/50 border border-border
              rounded-xl px-3 py-2.5 text-sm text-foreground
              placehodler:text-muted-foreground/40 focus:outline-none
              focus:ring-2 focus:ring-primary/40 focus:border-primary/40
              transition-all"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
              }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hold (ms)">
              <input
                type="number"
                value={draft.holdMs}
                onChange={(e) => set({ holdMs: Number(e.target.value) })}
                className="w-full bg-secondary/50 border border-border
                rounded-xl px-3 py-2.5 text-sm text-foreground
                placehodler:text-muted-foreground/40 focus:outline-none
                focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                transition-all"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
              />
            </Field>
            <Field label="Min Amount">
              <input
                type="number"
                value={draft.minAmount}
                onChange={(e) => set({ minAmount: Number(e.target.value) })}
                className="w-full bg-secondary/50 border border-border
                rounded-xl px-3 py-2.5 text-sm text-foreground
                placehodler:text-muted-foreground/40 focus:outline-none
                focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                transition-all"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
              />
            </Field>
          </div>
          {status === 'error' && (
            <div
              className="flex items-center gap-2 text-xs text-red-400
              bg-red-500/10 border border-red-500/20 rounded-lg px-3
              py-2"
            >
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={status === 'saving'}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl
                text-sm font-semibold transition-all ${
                  status === 'saved'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                } disabled:opacity-50`}
            >
              <Save size={13} />
              {status === 'saving'
                ? 'Saving...'
                : status === 'saved'
                  ? 'Saved!'
                  : 'Save'}
            </button>

            <button
              onClick={() => previewRef.current?.previewDraft(kind, draft)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                text-sm font-semibold bg-secondary/50 hover:bg-secondary
                text-muted-foreground hover:text-foreground border
                border-border transition-all"
            >
              <Eye size={13} />
              Preview
            </button>

            <button
              onClick={() => fireTestAlert(kind)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl
                text-sm font-semibold border transition-all ml-auto
                ${meta.bg} ${meta.color} hover:opacity-90`}
            >
              <Flame size={13} />
              Fire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
