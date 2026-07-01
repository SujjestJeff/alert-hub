export function createSoundPlayer(config) {
  const cache = new Map();
  for (const cfg of Object.values(config)) {
    if (cfg.sound && !cache.has(cfg.sound)) {
      const a = new Audio(cfg.sound);
      a.preload = "auto";
      a.load();
      cache.set(cfg.sound, a);
    }
  }
  return {
    play(src) {
      if (!src) return;
      const base = cache.get(src);
      const a = base ? base.cloneNode() : new Audio(src);
      a.volume = 0.8;
      a.play().catch((err) => console.warn("[overlay] audio blocked/failed:", err?.name ?? err));
    },
  };
}
