import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Monitor } from 'lucide-react';
import { createDomRenderer } from '@overlay/renderer.js';
import { KIND_CLASS, makeSampleAlert } from '@overlay/kinds.js';
import '@overlay/alert.css';
import './preview.css';
import { getOverlayToken, getOverlayConfig } from './api';
import { resolveAlert } from '@overlay/resolve.js';

export interface PreviewHandle {
  previewDraft: (kind: string, draft: any, amount?: number) => void;
}

export const AlertPreview = forwardRef<PreviewHandle>(
  function AlertPreview(_props, ref) {
    const boxRef = useRef<HTMLDivElement>(null);
    const playRef = useRef<((a: any, c: any) => Promise<void>) | null>(null);
    const liveConfig = useRef<Record<string, any>>({});

    useEffect(() => {
      const box = boxRef.current!;
      playRef.current = createDomRenderer(box, { playSound: () => {} });

      let source: EventSource | null = null;
      (async () => {
        const { token } = await getOverlayToken();
        liveConfig.current = (await getOverlayConfig(token)).alerts;
        source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
        source.addEventListener('alert', (e: MessageEvent) => {
          const a = JSON.parse(e.data);
          const cfg = liveConfig.current[a.kind];
          if (cfg) playRef.current?.(a, resolveAlert(a.kind, cfg, a));
        });
        source.addEventListener(
          'config',
          (e: MessageEvent) => (liveConfig.current = JSON.parse(e.data).alerts),
        );
      })();
      return () => source?.close();
    }, []);

    useImperativeHandle(ref, () => ({
      previewDraft(kind, draft, amount) {
        const alert = {
          ...makeSampleAlert(kind),
          ...amountFields(kind, amount),
        };
        playRef.current?.(alert, resolveAlert(kind, draft, amount));
      },
    }));

    function amountFields(kind: string, amount?: number) {
      if (amount == null) return {};
      if (kind === 'cheer') return { bits: amount };
      if (kind === 'resub') return { months: amount };
      return { count: amount };
    }

    return (
      <>
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <Monitor size={14} className="text-primary" />
            <span
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: 'Outift, sans-serif' }}
            >
              OBS Preview
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Live preview - fires to overlays
          </p>
        </div>
        <div className="preview-stage flex-1">
          <div ref={boxRef} className="alert hidden" />
        </div>
      </>
    );
  },
);

function toOverlayConfig(payload: any) {
  const out: Record<string, any> = {};
  for (const [kind, c] of Object.entries<any>(payload.alerts)) {
    out[kind] = {
      template: c.template,
      sound: c.sound,
      holdMs: c.holdMs,
      cssClass: KIND_CLASS[kind] ?? '',
    };
  }
  return out;
}
