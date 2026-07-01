import { formatSSE } from "./sse.js";

export interface SSEClient { write(chunk: string): void; }


export class SseHub {
  private clients = new Set<SSEClient>();

  get size(): number { return this.clients.size; }

  add(client: SSEClient): () => void {
    this.clients.add(client);
    return () => this.clients.delete(client);
  }

  broadcast(event: string, data: unknown): void {
    const chunk = formatSSE(event, data);
    for (const c of this.clients) {
      try { c.write(chunk); }
      catch { this.clients.delete(c); }
    }
  }
}
