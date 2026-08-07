const clampPct = (current, target) =>
  Math.max(0, Math.min(100, target > 0 ? (current / target) * 100 : 0));

function render(container, goals) {
  container.innerHTML = '';
  for (const g of goals) {
    if (!g.enabled) continue;
    const pct = clampPct(g.current, g.target);
    const row = document.createElement('div');
    row.className = 'goal';
    row.innerHTML = `
    <div class="goal-head">
      <span class="goal-label">${g.label}</span>
      <span class="goal-nums">${g.current} / ${g.target}</span>
    </div>
    <div class="goal-track"><div class="goal-fill"></div></div>`;
    container.appendChild(row);
    const fill = row.querySelector('.goal-fill');
    fill.style.background = g.color;
    requestAnimationFrame(() => (fill.style.width = `${pct}%`));
  }
}

export async function startGoals(token) {
  const container = document.createElement('div');
  container.id = 'goals';
  document.body.appendChild(container);

  const res = await fetch(`/overlay/goals?token=${encodeURIComponent(token)}`);
  if (res.ok) render(container, (await res.json()).goals);

  const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);
  source.addEventListener('goal', (e) => render(container, JSON.parse(e.data)));
}

export { clampPct };
