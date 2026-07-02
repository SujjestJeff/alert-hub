import type { FastifyRequest, FastifyReply } from "fastify";
export const ADMIN_COOKIE = "alertbox_admin";

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const raw = req.cookies[ADMIN_COOKIE];
  const result = raw ? req.unsignCookie(raw) : { valid: false };
  if (!result.valid) return reply.code(401).send({ error: "unauthorized" });
}
