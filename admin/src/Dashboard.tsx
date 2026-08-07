import type { RefObject } from 'react';
import { useState } from 'react';
import { Radio } from 'lucide-react';
import { StatusBar } from './StatusBar';
import { ConfigEditor } from './ConfigEditor';
import { AlertPreview, type PreviewHandle } from './AlertPreview';
import { GoalsEditor } from './GoalsEditor';

export function Dashboard({
  config,
  setConfig,
  previewRef,
}: {
  config: any;
  setConfig: (c: any) => void;
  previewRef: RefObject<PreviewHandle | null>;
}) {
  const [tab, setTab] = useState<'alerts' | 'goals'>('alerts');

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px]
            rounded-full bg-primary/6 blur-[130px]"
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px]
            rounded-full bg-accent/5 blur-[120px]"
        />
      </div>

      <header
        className="relative z-10 flex items-center justify-between px-6
          py-4 border-b border-border bg-card/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg bg-priamry/20 border
              border-primary/40 flex items-center justify-center
              shadow-[0_0_12px_rgba(124,58,237,0.3)]"
          >
            <Radio size={14} className="text-primary" />
          </div>
          <span
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            AlertBox
          </span>
          <span
            className="text-xs text-muted-foreground border border-border
              rounded px-2 py-0.5"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            admin
          </span>
        </div>
        <StatusBar />
      </header>

      <main className="relative z-10 flex flex-1 gap-0 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab('alerts')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                tab === 'alerts'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border-border'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setTab('goals')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                tab === 'goals'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border-border'
              }`}
            >
              Goals
            </button>
          </div>
          {tab === 'alerts' ? (
            <ConfigEditor
              config={config}
              onChange={setConfig}
              previewRef={previewRef}
            />
          ) : (
            <GoalsEditor />
          )}{' '}
        </div>
        <aside
          className="w-[380px] shrink-0 border-l border-border bg-card/40
            flex flex-col overflow-hidden"
        >
          <AlertPreview ref={previewRef} />
        </aside>
      </main>
    </div>
  );
}
