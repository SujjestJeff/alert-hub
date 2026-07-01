import type { FastifyInstance } from 'fastify'
import { checkOverlayToken } from '../overlay/sse.js'
import type { SseHub } from "../overlay/sseHub.js";
import type { AlertQueue } from "../alerts/alertQueue.js";

interface Opts { hub: SseHub; queue: AlertQueue }

export default async function eventsRoutes(app: FastifyInstance, opts: Opts) {
  const { hub, queue } = opts;

  app.get("/events", (req, reply) => {
    const { token } = req.query as Record<string, string>;
    if (!checkOverlayToken(token)) return reply.code(401).send("unauthorized");

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    raw.write(":\n\n");

    const remove = hub.add({ write: (c) => raw.write(c) });
    const keepalive = setInterval(() => raw.write(": ping\n\n"), 15_000);

    req.raw.on("close", () => { clearInterval(keepalive); remove(); });
  });

  app.post("/events/done", (req, reply) => {
    const { token } = req.query as Record<string, string>;
    if (!checkOverlayToken(token)) return reply.code(401).send("unauthorized");
    const { id } = (req.body ?? {}) as { id?: string };
    if (id) queue.markDone(id);
    return reply.code(204).send();
  })
}
