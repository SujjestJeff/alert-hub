import { EventEmitter } from "node:events";
import type { NormalizedAlert } from "./types.js";

export interface QueueOptions {
  maxDurationMs: number;
  gapMs: number;
}


export class AlertQueue extends EventEmitter {
  private queue: NormalizedAlert[] = [];
  private current?: NormalizedAlert;
  private doneTimer?: NodeJS.Timeout;

  constructor(private opts: QueueOptions) { super(); }

  get length(): number { return this.queue.length; }
  get isPlaying(): boolean { return this.current !== undefined; }

  enqueue(alert: NormalizedAlert): void {
    this.queue.push(alert);
    this.pump();
  }

  markDone(id: string): void {
    if (this.current?.id === id) this.finish();
  }

  private pump(): void {
    if (this.current) return;
    const next = this.queue.shift();
    if (!next) { this.emit("idle"); return; }
    this.current = next;
    this.emit("play", next);
    this.doneTimer = setTimeout(() => this.finish(), this.opts.maxDurationMs);
  }

  private finish(): void {
    clearTimeout(this.doneTimer);
    this.current = undefined;
    setTimeout(() => this.pump(), this.opts.gapMs);
  }
}
