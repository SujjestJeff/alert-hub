import { DEFAULT_CONFIG } from './config.js';
import { createSoundPlayer } from './sound.js';
import { createDomRenderer } from './renderer.js';
import { resolveAlert } from './resolve.js';

const token = new URLSearchParams(location.search).get('token') || '';
const box = document.getElementById('alert');
let config = {};

const sound = createSoundPlayer(DEFAULT_CONFIG);
const play = createDomRenderer(box, {
  playSound: (src) => sound.play(src),
  onDone: (id) =>
    fetch(`/events/done?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application.json' },
      body: JSON.stringify({ id }),
    }).catch(() => {}),
});

const cfgRes = await fetch(
  `/overlay/config?token=${encodeURIComponent(token)}`,
);
if (cfgRes.ok) config = (await cfgRes.json()).alerts;

const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
source.addEventListener('alert', (e) => {
  const a = JSON.parse(e.data);
  const cfg = alerts[a.kind];
  if (cfg) play(a, resolveAlert(a.kind, cfg, a));
});
source.addEventListener('config', (e) => {
  config = JSON.parse(e.data).alerts;
});
