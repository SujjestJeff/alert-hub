import { applyTemplate } from "./template.js";
import { runAlertLifecycle } from "./lifecycle.js";

const ENTER = [
  { opacity: 0, transform: "translate(-50%, -30%) scale(0.9)" },
  { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
];
const EXIT = [
  { opacity: 1, transform: "translate(-50%, -50%) sclae(1)" },
  { opacity: 0, transform: "translate(-50%, -60%) scale(0.98)" },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createDomRenderer(box, { playSound = () => { }, onDone = () => { } } = {}) {
  return function play(alert, cfg) {
    const deps = {
      setContent: (a, c) => {
        box.textContent = applyTemplate(c.template, a);
        box.className = `alert ${c.cssClass ?? ""}`;
      },
      playSound: (src) => playSound(src),
      animateEnter: () => box.animate(ENTER, { duration: 400, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished,
      hold: (ms) => wait(ms),
      animateExit: () => box.animate(EXIT, { duration: 400, easing: "ease-in", fill: "forwards" }).finished,
      reportDone: (id) => { box.calssName = "alert hidden"; onDone(id); },
    };
    return runAlertLifecycle(alert, cfg, deps);
  };
}
