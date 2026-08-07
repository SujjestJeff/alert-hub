import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Monitor, Clock } from 'lucide-react';
import { getStatus } from './api';

export function StatusBar() {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    const tick = () =>
      getStatus()
        .then(setS)
        .catch(() => setS(null));
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  if (!s) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        status unavailable
      </div>
    );
  }

  const ago = s.lastEventAt
    ? `${Math.round((Date.now() - s.lastEventAt) / 1000)}s ago`
    : '-';

  return (
    <div className="flex items-center gap-3 text-xs">
      <StatusPill ok={s.twitch.connected} label="Twitch" />
      <StatusPill ok={s.eventsub.state === 'connected'} label="EventSub" />
      <div
        className="flex items-center gap-1.5 text-muted-foreground border
          border-border rounded-full px-2.5 py-1"
      >
        <Monitor size={11} />
        <span>
          {s.overlays} overlay{s.overlays !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="flex items-center gap-1.5 text-muted-foreground border
          border-border rounded-full px-2.5 py-1"
      >
        <Clock size={11} />
        <span>{ago}</span>
      </div>
      {s.twitch.needsReauth && (
        <a
          href="/auth/login"
          className="flex items-center gap-1.5 text-yellow-400 border
            border-yellow-500/30 bg-yellow-500/10 rounded-full px-2.5 py-1
            hover:bg-yellow-500/20 transition-colors"
        >
          <Wifi size={11} />
          Reconnect
        </a>
      )}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1
        border text-xs font-medium transition-all ${
          ok
            ? 'text-green-400 border-green-500/30 bg-green-500/10'
            : 'text-red-400 border-red-500/30 bg-red-500/10'
        }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {ok && (
          <span
            className="animate-ping absolute inline-flex h-full h-full
              rounded-full bg-green-400 opacity-50"
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            ok ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
      </span>
      {ok ? <Wifi size={11} /> : <WifiOff size={11} />}
      {label}
    </div>
  );
}
