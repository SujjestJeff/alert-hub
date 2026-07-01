import { EventEmitter } from "node:events";
import WebSocket from "ws";
import { env } from "../env.js";
import { createSubscription } from "./helix.js";
import { desiredSubscriptions } from "./subscriptions.js";

const WS_URL = env.EVENTSUB_WS_URL ?? "wss://eventsub.wss.twitch.tv/ws";
const KEEPALIVE_GRACE_MS = 10_000;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const DEDUPE_TTL_MS = 10 * 60_000;

interface Metadata {
  message_id: string;
  message_type: "session_welcome" | "session_keepalive" | "notification" | "session_reconnect" | "revocation";
  message_timestamp: string;
  subscription_type?: string;
}
interface SessionPayload {
  session: { id: string; keepalive_timeout_seconds: number | null; reconnect_url: string | null };
}
interface NotificationPayload {
  subscription: { id: string; type: string; status: string };
  event: Record<string, unknown>;
}

export interface NormalizedNotification {
  messageId: string;
  subscriptionType: string;
  event: Record<string, unknown>;
}


export class EventSubClient extends EventEmitter {
  private ws?: WebSocket;
  private sessionId?: string;
  private keepaliveTimer?: NodeJS.Timeout;
  private currentTimeoutMs = 20_000;
  private backoff = BASE_BACKOFF_MS;
  private closedByUs = false;
  private seen = new Map<string, number>();

  constructor(private broadcasterId: string) { super(); }

  start(): void {
    this.closedByUs = false;
    this.connect(WS_URL, false);
  }

  stop(): void {
    this.closedByUs = true;
    clearTimeout(this.keepaliveTimer);
    this.ws?.close();
  }

  private connect(url: string, isMigration: boolean): void {
    const socket = new WebSocket(url);
    socket.on("message", (data) => this.handleRaw(data.toString(), socket, isMigration));
    socket.on("close", (code) => this.onClose(code, socket));
    socket.on("error", (err) => this.emit("error", err));
  }

  handleRaw(raw: string, socket: WebSocket, isMigration: boolean): void {
    let msg: { metadata: Metadata; payload: unknown };
    try { msg = JSON.parse(raw); } catch { return; }
    const { metadata, payload } = msg;

    if (this.isDuplicate(metadata)) return;
    this.resetKeepalive();

    switch (metadata.message_type) {
      case "session_welcome": return void this.onWelcome(payload as SessionPayload, socket, isMigration);
      case "session_keepalive": return;
      case "notification": return this.onNotification(metadata, payload as NotificationPayload);
      case "session_reconnect": return this.onReconnect(payload as SessionPayload);
      case "revocation": return this.onRevocation(payload as NotificationPayload);
    }
  }

  private async onWelcome(payload: SessionPayload, socket: WebSocket, isMigration: boolean): Promise<void> {
    this.sessionId = payload.session.id;
    this.currentTimeoutMs = (payload.session.keepalive_timeout_seconds ?? 10) * 1000 + KEEPALIVE_GRACE_MS;
    this.resetKeepalive();
    this.backoff = BASE_BACKOFF_MS;

    const old = this.ws;
    this.ws = socket;
    this.emit("connected", this.sessionId);

    old?.close();
    if (!isMigration) await this.subscribeAll();
  }

  private onReconnect(payload: SessionPayload): void {
    const url = payload.session.reconnect_url;
    if (!url) return;
    this.connect(url, true);
  }

  private onNotification(metadata: Metadata, payload: NotificationPayload): void {
    this.emit("notification", {
      messageId: metadata.message_id,
      subscriptionType: metadata.subscription_type ?? payload.subscription.type,
      event: payload.event,
    } satisfies NormalizedNotification);
  }

  private onRevocation(payload: NotificationPayload): void {
    this.emit("revocation", payload.subscription);
  }

  private async subscribeAll(): Promise<void> {
    if (!this.sessionId) return;
    for (const spec of desiredSubscriptions(this.broadcasterId)) {
      try {
        const status = await createSubscription(spec, this.sessionId);
        if (status !== "enabled") this.emit("sub-warning", { spec, status });
      } catch (err) {
        this.emit("sub-error", { spec, err });
      }
    }
  }

  private onClose(_code: number, socket: WebSocket): void {
    if (socket !== this.ws) return;
    clearTimeout(this.keepaliveTimer);
    if (this.closedByUs) return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const jitter = Math.random() * 0.3 * this.backoff;
    const delay = Math.min(this.backoff, MAX_BACKOFF_MS) + jitter;
    setTimeout(() => this.connect(WS_URL, false), delay);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }

  private resetKeepalive(): void {
    clearTimeout(this.keepaliveTimer);
    this.keepaliveTimer = setTimeout(() => this.ws?.terminate(), this.currentTimeoutMs);
  }

  private isDuplicate(metadata: Metadata): boolean {
    const ts = Date.parse(metadata.message_timestamp);
    if (Number.isFinite(ts) && Date.now() - ts > DEDUPE_TTL_MS) return true;
    if (this.seen.has(metadata.message_id)) return true;
    this.seen.set(metadata.message_id, Date.now());
    if (this.seen.size > 1000) {
      const cutoff = Date.now() - DEDUPE_TTL_MS;
      for (const [id, t] of this.seen) if (t < cutoff) this.seen.delete(id);
    }
    return false;
  }
}

