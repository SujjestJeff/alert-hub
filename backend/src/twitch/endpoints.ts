export const TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize";
export const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
export const TWITCH_VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";
export const TWITCH_REVOKE_URL = "https://id.twitch.tv/oauth2/revoke";

export const SCOPES = [
  "moderator:read:followers",
  "channel:read:subscriptions",
  "bits:read",
] as const;
