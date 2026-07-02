import type { FastifyInstance } from "fastify";
import type { EventSubClient } from "../twitch/eventSubClient.js";
import type { SseHub } from "../overlay/sseHub.js";
import { timingSafeEqual } from "node:crypto";
import { env } from "../env.js";
import { configStore } from "../config/configStore.js";
import { ALERT_KINDS, type AlertKind } from "../config/schema.js";
import { requireAdmin, ADMIN_COOKIE } from "./adminAuth.js";
import { makeStatusSnapshot } from "../status/statusService.js";

interface AdminRoutesOpts {
  fireTest: (kind: AlertKind) => void;
  eventsub: EventSubClient;
  hub: SseHub;
  lastEventAt: () => number | null;
}

function passwordOk(input: unknown): boolean {
  if (typeof input !== "string" || !env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(input), b = Buffer.from(env.ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function adminRoutes(app: FastifyInstance, opts: AdminRoutesOpts) {
  app.post("/admin/login", async (req, reply) => {
    const { password } = (req.body ?? {}) as { password?: string };
    if (!passwordOk(password)) return reply.code(401).send({ error: "bad password" });
    reply.setCookie(ADMIN_COOKIE, String(Date.now()), {
      signed: true, httpOnly: true, sameSite: "lax", path: "/",
      secure: env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true }
  })


  app.post("/admin/logout", async (_req, reply) => {
    reply.clearCookie(ADMIN_COOKIE, { path: "/" });
    return { ok: true };
  })

  app.get("/admin/api/config", { preHandler: requireAdmin }, async () => configStore.getAll());

  app.put("/admin/api/config/:kind", { preHandler: requireAdmin }, async (req, reply) => {
    const { kind } = req.params as { kind: string };
    if (!ALERT_KINDS.includes(kind as AlertKind)) return reply.code(404).send({ error: "unknown kind" });
    try { return configStore.updateAlert(kind as AlertKind, req.body); }
    catch (err) { return reply.code(400).send({ error: "invalid config", detail: String(err) }); }
  });

  app.put("/admin/api/settings", { preHandler: requireAdmin }, async (req, reply) => {
    try { return configStore.updateSettings(req.body); }
    catch (err) { return reply.code(400).send({ error: "invalid settings", detail: String(err) }); }
  });

  app.get("/admin/api/overlay-token", { preHandler: requireAdmin }, async () => ({ token: env.OVERLAY_TOKEN ?? "" }));

  app.post("/admin/api/test-alert", { preHandler: requireAdmin }, async (req, reply) => {
    const { kind } = (req.body ?? {}) as { kind?: string };
    if (!kind || !ALERT_KINDS.includes(kind as AlertKind)) return reply.code(400).send({ error: "unknown kind" });
    opts.fireTest(kind as AlertKind)
    return { ok: true };
  });

  app.get("/admin/api/status", { preHandler: requireAdmin }, async () =>
    makeStatusSnapshot(opts.eventsub, opts.hub, opts.lastEventAt()));
}
