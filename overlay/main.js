import { applyTemplate } from "./template.js";
import { DEFAULT_CONFIG } from "./config.js";
import { runAlertLifecycle } from "./lifecycle.js";
import { createSoundPlayer } from "./sound.js";

const token = new URLSearchParams(location.search).get("token") || "";
const box = document.getElementById("alert");
const config = DEFAULT_CONFIG;
const sound = createSoundPlayer(config);


const ENTER = [
  { opacity: 0, transform: "translate(-50%, -30%) scale(0.9)" },
  { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
];
const EXIT = [
  { opacity: 1, transform: "translate(-50%, -50%) sclae(1)" },
  { opacity: 0, transform: "translate(-50%, -60%) scale(0.98)" },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));


const deps = {
  setContent: (alert, cfg) => {
    box.textContent = applyTemplate(cfg.template, alert);
    box.className = `alert ${cfg.cssClass}`;
  },
  playSound: (src) => sound.play(src),
  animateEnter: () => box.animate(ENTER, { duration: 400, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished,
  hold: (ms) => wait(ms),
  animateExit: () => box.animate(EXIT, { duration: 400, easing: "ease-in", fill: "forwards" }).finished,
  reportDone: (id) => {
    box.className = "alert hidden";
    fetch(`/events/done?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => { });
  },
};

const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);

source.addEventListener("alert", (e) => {
  const alert = JSON.parse(e.data);
  runAlertLifecycle(alert, config[alert.kind] ?? config.default, deps);
});
