declare module "@overlay/renderer.js" {
  export function createDomRenderer(
    box: HTMLElement,
    opts?: { playSound?: (src: string | null) => void; onDone?: (id: string) => void },
  ): (alert: any, cfg: any) => Promise<void>;
}
declare module "@overlay/kinds.js" {
  export const KIND_CLASS: Record<string, string>;
  export function makeSampleAlert(kind: string): any;
}
