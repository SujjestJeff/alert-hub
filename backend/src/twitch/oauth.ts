import { randomBytes } from "node:crypto";
import { env } from "../env.js";
import { TWITCH_AUTHORIZE_URL, TWITCH_TOKEN_URL, TWITCH_VALIDATE_URL, SCOPES } from "./endpoints.js";

export function makeState(): string {
  return randomBytes(16).toString("hex")
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.TWITCH_CLIENT_ID,
    redirect_uri: env.TWITCH_REDIRECT_URI,
    scope: SCOPES.join(" "),
    state,
  });
  return `${TWITCH_AUTHORIZE_URL}?${params.toString()}`;
}

interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  token_type: string;
}

function toStored(r: TwitchTokenResponse) {
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresAt: Date.now() + r.expires_in * 1000,
    scopes: r.scope ?? [],
  };
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.TWITCH_REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return toStored((await res.json()) as TwitchTokenResponse);
}

export class RefreshRevokedError extends Error { }

export async function refreshTokens(refreshToken: string) {
  const res = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grand_type: "refresh_token",
      refresh_token: refreshToken
    }),
  });

  if (res.status === 400 || res.status === 401) {
    throw new RefreshRevokedError(`Refresh rejected: ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Refresh failed (transient): ${res.status}`);
  }

  return toStored((await res.json()) as TwitchTokenResponse);
}

export async function validateToken(accessToken: string): Promise<number | null> {
  const res = await fetch(TWITCH_VALIDATE_URL, {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Validate failed: ${res.status}');
  const body = (await res.json()) as { expires_in: number };
  return body.expires_in;
}
