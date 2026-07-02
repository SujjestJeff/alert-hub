import { DEFAULT_CONFIG } from "./config.js";
import { createSoundPlayer } from "./sound.js";
import { createDomRenderer } from "./renderer.js";
import { KIND_CLASS } from "./kinds.js";

const token = new URLSearchParams(location.search).get("token") || "";
const box = document.getElementById("alert");
let config = {};

function mergeConfig(payload) {
  const out = {};
  for (const [kind, c] of Object.entries(payload.alerts)) {
    out[kind] = { template: c.template, sound: c.sound, holdMs: c.holdMs, cssClass: KIND_CLASS[kind] ?? "" };
  }
  return out;
}

const sound = createSoundPlayer(DEFAULT_CONFIG);
const play = createDomRenderer(box, {
  playSound: (src) => sound.play(src),
  onDone: (id) => fetch(`/events/done?token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "Content-Type": "application.json" }, body: JSON.stringify({ id }),
  }).catch(() => { }),
});

const cfgRes = await fetch(`/overlay/config?token=${encodeURIComponent(token)}`);
if (cfgRes.ok) config = mergeConfig(await cfgRes.json());

const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
source.addEventListener("alert", (e) => { const a = JSON.parse(e.data); play(a, config[a.kind] ?? config.follow); });
source.addEventListener("config", (e) => { config = mergeConfig(JSON.parse(e.data)); });
