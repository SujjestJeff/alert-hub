export async function runAlertLifecycle(alert, cfg, deps) {
  const { setContent, playSound, animateEnter, hold, animateExit, reportDone } = deps;
  setContent(alert, cfg);
  try { void playSound(cfg.sound); } catch { /* audio must never block the visual path */ }
  await animateEnter();
  await hold(cfg.holdMs ?? 3000);
  await animateExit();
  reportDone(alert.id);
}
