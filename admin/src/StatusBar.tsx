import { useEffect, useState } from "react";
import { getStatus } from "./api";

export function StatusBar() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    const tick = () => getStatus().then(setS).catch(() => setS(null));
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  if (!s) return <div className="statusbar">status unavailable</div>;
  const ago = s.lastEventAt ? `${Math.round((Date.now() - s.lastEventAt) / 1000)}s ago` : "-";

  return (
    <div className="statusbar">
      <Dot ok={s.twitch.connected} label="Twitch" />
      <Dot ok={s.eventsub.state === "connected"} label={`EventSub (${s.eventsub.state})`} />
      <span>Overlays: {s.overlays}</span>
      <span>Last event: {ago}</span>
      {s.twitch.needsReauth && <a href="/auth/login">Reconnect Twitch </a>}
    </div>
  );
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return <span><span style={{ color: ok ? "#4ade80" : "#f87171" }}>●</span> {label}</span>
}
