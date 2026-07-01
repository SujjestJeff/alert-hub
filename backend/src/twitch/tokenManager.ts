import { EventEmitter } from "node:events";
import { loadTokens, saveTokens, clearTokens, type TokenSet } from "./tokenStore.js";
import { refreshTokens, validateToken, RefreshRevokedError } from "./oauth.js";

const REFRESH_MARGIN_MS = 20 * 60 * 1000;
const MIN_DELAY_MS = 30 * 1000;
const VALIDATE_EVERY_MS = 5 * 60 * 1000;

class TokenManager extends EventEmitter {
  private tokenSet: TokenSet | null = null;
  private refreshTimer?: NodeJS.Timeout;
  private validateTimer?: NodeJS.Timeout;
  private inFlight: Promise<TokenSet> | null = null;
  needsReauth = false;

  init() {
    this.tokenSet = loadTokens();
    if (this.tokenSet) {
      this.scheduleRefresh();
      this.validateTimer = setInterval(() => this.revalidate(), VALIDATE_EVERY_MS);
    } else {
      this.needsReauth = true;
    }
  }

  setTokenSet(t: TokenSet) {
    this.tokenSet = t;
    this.needsReauth = false;
    saveTokens(t);
    this.scheduleRefresh();
    if (!this.validateTimer) {
      this.validateTimer = setInterval(() => this.revalidate(), VALIDATE_EVERY_MS);
    }
    this.emit("connected");
  }

  async getValidAccessToken(): Promise<string> {
    if (!this.tokenSet) throw new Error("not_authenticated");
    if (Date.now() < this.tokenSet.expiresAt - 60_000) {
      return this.tokenSet.accessToken;
    }
    const fresh = await this.refreshNow();
    return fresh.accessToken;
  }

  status() {
    return {
      connected: !!this.tokenSet && !this.needsReauth,
      needsReauth: this.needsReauth,
      expiresAt: this.tokenSet?.expiresAt ?? null,
      scopes: this.tokenSet?.scopes ?? [],
    };
  }

  // --- internals ---

  private scheduleRefresh() {
    clearTimeout(this.refreshTimer);
    if (!this.tokenSet) return;
    const delay = Math.max(this.tokenSet.expiresAt - Date.now() - REFRESH_MARGIN_MS, MIN_DELAY_MS)
    this.refreshTimer = setTimeout(() => {
      this.refreshNow().catch((err) => {
        if (!(err instanceof RefreshRevokedError)) {
          this.refreshTimer = setTimeout(() => this.scheduleRefresh(), 60_000);
        }
      });
    }, delay);
  }

  private refreshNow(): Promise<TokenSet> {
    if (this.inFlight) return this.inFlight;
    if (!this.tokenSet) return Promise.reject(new Error("not_authenticated"));

    const refreshToken = this.tokenSet.refreshToken;
    this.inFlight = (async () => {
      try {
        const fresh = await refreshTokens(refreshToken);
        this.tokenSet = fresh;
        saveTokens(fresh);
        this.scheduleRefresh();
        return fresh
      } catch (err) {
        if (err instanceof RefreshRevokedError) this.markDead();
        throw err;
      } finally {
        this.inFlight = null;
      }
    })();
    return this.inFlight
  }

  private async revalidate() {
    if (!this.tokenSet) return;
    try {
      const remaining = await validateToken(this.tokenSet.accessToken);
      if (remaining === null) {
        await this.refreshNow();
      }
    } catch {

    }
  }

  private markDead() {
    this.needsReauth = true;
    clearTokens();
    this.tokenSet = null;
    clearTimeout(this.refreshTimer);
    console.error("[auth] refresh token rejected - re-auth required");
    this.emit("needs-reauth");
  }

}

export const tokenManager = new TokenManager();
