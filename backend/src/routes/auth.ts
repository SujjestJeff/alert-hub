import type { FastifyInstance } from 'fastify'
import { buildAuthorizeUrl, exchangeCodeForTokens, makeState } from '../twitch/oauth.js'
import { tokenManager } from "../twitch/tokenManager.js";

const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function rememberState(s: string) {
  pendingStates.set(s, Date.now() + STATE_TTL_MS);
}

function consumeState(s: string): boolean {
  const exp = pendingStates.get(s);
  pendingStates.delete(s);
  return !!exp && exp > Date.now();
}

export default async function authRoutes(app: FastifyInstance) {
  app.get("/auth/login", async (_req, reply) => {
    const state = makeState();
    rememberState(state);
    return reply.redirect(buildAuthorizeUrl(state));
  });

  app.get("/auth/callback", async (req, reply) => {
    const { code, state, error, error_description } = req.query as Record<string, string>;
    if (error) return reply.code(400).send(`Twitch denied authorization: ${error_description ?? error}`);
    if (!code || !state) return reply.code(400).send("Missing code or state.");
    if (!consumeState(state)) return reply.code(400).send("Invalid or expired state. Start again at /auth/login.");

    try {
      const tokenSet = await exchangeCodeForTokens(code);
      tokenManager.setTokenSet(tokenSet);
      return reply.redirect("/auth/success");
    } catch (err) {
      req.log.error({ err }, "token exchange failed");
      return reply.code(502).send("Could not complete authorization with Twitch.");
    }
  });

  app.get("/auth/status", async () => tokenManager.status());

  app.get("/auth/success", async (_req, reply) =>
    reply.type("text/html").send("<h1>Connected to Twitch</h1><p>You can close this tab.</p>"));
}
