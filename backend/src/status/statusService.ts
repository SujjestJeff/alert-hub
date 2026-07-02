import { tokenManager } from "../twitch/tokenManager.js";
import type { EventSubClient } from "../twitch/eventSubClient.js";
import type { SseHub } from "../overlay/sseHub.js";

export function makeStatusSnapshot(eventsub: EventSubClient, hub: SseHub, lastEventAt: number | null) {
  const twitch = tokenManager.status();
  return {
    twitch: { connected: twitch.connected, needsReauth: twitch.needsReauth, expiresAt: twitch.expiresAt },
    eventsub: { state: eventsub.state, sessionId: eventsub.sessionId ?? null },
    overlays: hub.size,
    lastEventAt,
    healthy: twitch.connected && eventsub.state === "connected",
  };
}
