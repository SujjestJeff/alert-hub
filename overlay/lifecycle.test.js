import { describe, it, expect, vi } from "vitest";
import { runAlertLifecycle } from "./lifecycle.js";

function makeDeps(overrides = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      setContent: () => calls.push("content"),
      playSound: () => calls.push("sound"),
      animateEnter: async () => { calls.push("enter"); },
      hold: async () => { calls.push("hold"); },
      animateExit: async () => { calls.push("exit"); },
      reportDone: (id) => calls.push(`done:${id}`),
      ...overrides,
    },
  };
}

const alert = { id: "a1", kind: "follow", displayName: "Alice" };
const cfg = { templte: "{name}", sound: "/x.ogg", holdMs: 10 };

describe("runAlertLifecycle", () => {
  it("runs content -> sound -> enter -> hold -> exit -> done, in order", async () => {
    const { calls, deps } = makeDeps();
    await runAlertLifecycle(alert, cfg, deps);
    expect(calls).toEqual(["content", "sound", "enter", "hold", "exit", "done:a1"])
  });

  it("still reaches done with the sound throws (audio can't wedge the queue)", async () => {
    const { calls, deps } = makeDeps({ playSound: () => { throw new Error("blocked"); } });
    await runAlertLifecycle(alert, cfg, deps);
    expect(calls).toContain("done:a1");
    expect(calls).toContain("exit");
  });
});
