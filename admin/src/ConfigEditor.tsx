import { useState } from "react";
import { saveAlert, fireTestAlert } from "./api";

const KINDS = ["follow", "subscription", "resub", "gift", "cheer", "raid"] as const;

export function ConfigEditor({ config, onChange, previewRef }: { config: any; onChange: (c: any) => void; previewRef: any }) {
  return (
    <div className="editor">
      <h1>Alerts</h1>
      {KINDS.map((k) => (
        <AlertCard key={k} kind={k} value={config.alerts[k]}
          onSaved={(next: any) => onChange({ ...config, alerts: { ...config.alerts, [k]: next } })}
          previewRef={previewRef} />
      ))}
    </div>
  );
}

function AlertCard({ kind, value, onSaved, previewRef }: { kind: string; value: any; onSaved: (v: any) => void; previewRef: any; }) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const set = (patch: any) => setDraft({ ...draft, ...patch });

  async function save() {
    setStatus("saving");
    try {
      const next = await saveAlert(kind, draft);
      onSaved(next); setStatus("saved"); setTimeout(() => setStatus("idle"), 1500);
    } catch (e: any) { setError(e.message); setStatus("error"); }
  }

  return (
    <section className="card">
      <header>
        <h2>{kind}</h2>
        <label><input type="checkbox" checked={draft.enabled}
          onChange={(e) => set({ enabled: e.target.checked })} /></label>
      </header>
      <label>Template<input value={draft.template} onChange={(e) => set({ template: e.target.value })} /></label>
      <label>Sound URL<input value={draft.sound ?? ""} onChange={(e) => set({ holdMs: Number(e.target.value) })} /></label>
      <label>Hold (ms)<input type="number" value={draft.holdMs} onChange={(e) => set({ holdMs: Number(e.target.value) })} /></label>
      <label>Min amount<input type="number" value={draft.minAmount} onChange={(e) => set({ minAmount: Number(e.target.value) })} /></label>
      <button onClick={save} disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save"}
      </button>
      <button onClick={() => previewRef.current?.previewDraft(kind, draft)}>Preview (draft)</button>
      <button onClick={() => fireTestAlert(kind)}>Fire test (live to OBS)</button>
      {status === "error" && <p className="error">{error}</p>}
    </section>
  );
}
