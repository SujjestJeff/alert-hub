import { env } from "../env.js";
import { tokenManager } from "./tokenManager.js";
import type { SubscriptionSpec } from "./subscriptions.js";

const HELIX = "https://api.twitch.tv/helix";

async function helix(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await tokenManager.getValidAccessToken();
  return fetch(`${HELIX}${path}`, {
    ...init,
    headers: {
      "Client-Id": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function getBraodcasterId(): Promise<string> {
  const res = await helix("/users");
  if (!res.ok) throw new Error(`getBraodcasterId failed: ${res.status}`);
  const body = (await res.json()) as { data: { id: string; login: string }[] };
  const me = body.data[0];
  if (!me) throw new Error("no user returned for token");
  return me.id;
}

export async function createSubscription(spec: SubscriptionSpec, sessionId: string): Promise<string> {
  const res = await helix("/eventsub/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      type: spec.type,
      version: spec.version,
      condition: spec.condition,
      transport: { method: "websocket", session_id: sessionId },
    }),
  });
  if (!res.ok) throw new Error(`create ${spec.type} failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: { status: string }[] };
  return body.data[0]?.status ?? "unknown";
}
