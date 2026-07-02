import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createDomRenderer } from "@overlay/renderer.js";
import { KIND_CLASS, makeSampleAlert } from "@overlay/kinds.js";
import "@overlay/alert.css";
import "./preview.css";
import { getOverlayToken, getOverlayConfig } from "./api";

export interface PreviewHandle { previewDraft: (kind: string, draft: any) => void; }

export const AlertPreview = forwardRef<PreviewHandle>(function AlertPreview(_props, ref) {
  const boxRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<((a: any, c: any) => Promise<void>) | null>(null);
  const liveConfig = useRef<Record<string, any>>({})

  useEffect(() => {
    const box = boxRef.current!;
    playRef.current = createDomRenderer(box, { playSound: () => { } });

    let source: EventSource | null = null;
    (async () => {
      const { token } = await getOverlayToken();
      liveConfig.current = toOverlayConfig(await getOverlayConfig(token));
      source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
      source.addEventListener("alert", (e: MessageEvent) => {
        const a = JSON.parse(e.data);
        playRef.current?.(a, liveConfig.current[a.kind] ?? liveConfig.current.follow);
      });
      source.addEventListener("config", (e: MessageEvent) =>
        (liveConfig.current = toOverlayConfig(JSON.parse(e.data))));
    })();
    return () => source?.close();
  }, []);

  useImperativeHandle(ref, () => ({
    previewDraft(kind, draft) {
      const cfg = { template: draft.template, sound: draft.sound, holdMs: draft.holdMs, cssClass: KIND_CLASS[kind] ?? "" };
      playRef.current?.(makeSampleAlert(kind), cfg);
    },
  }));

  return <div className="preview-stage"><div ref={boxRef} className="alert hidden" /></div>
});

function toOverlayConfig(payload: any) {
  const out: Record<string, any> = {};
  for (const [kind, c] of Object.entries<any>(payload.alerts)) {
    out[kind] = { template: c.template, sound: c.sound, holdMs: c.holdMs, cssClass: KIND_CLASS[kind] ?? "" };
  }
  return out;
}
