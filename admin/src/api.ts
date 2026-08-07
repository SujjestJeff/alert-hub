export class Unauthorized extends Error {}

async function json(res: Response) {
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error ?? res.statusText,
    );
  return res.json();
}

export const getConfig = () =>
  fetch('/admin/api/config', { credentials: 'include' }).then(json);

export const login = (password: string) =>
  fetch('/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).then((r) => r.ok);

export const saveAlert = (kind: string, patch: unknown) =>
  fetch(`/admin/api/config/${kind}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(json);

export const getOverlayToken = () =>
  fetch('/admin/api/overlay-token', { credentials: 'include' }).then(json);

export const getOverlayConfig = (token: string) =>
  fetch(`/overlay/config?token=${encodeURIComponent(token)}`).then((r) =>
    r.json(),
  );

export const fireTestAlert = (kind: string, amount?: number) =>
  fetch('/admin/api/test-alert', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, amount }),
  }).then(json);

export const getStatus = () =>
  fetch('/admin/api/status', { credentials: 'include' }).then(json);

export const getGoals = () =>
  fetch('/admin/api/goals', { credentials: 'include' }).then(json);

export const saveGoal = (patch: unknown) =>
  fetch('/admin/api/goals', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(json);

export const deleteGoal = (id: string) =>
  fetch(`/admin/api/goals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(json);

export const setGoalCurrent = (id: string, value: number) =>
  fetch(`/admin/api/goals/${id}/current`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }).then(json);

export const saveSettings = (patch: unknown) =>
  fetch('admin/api/settings', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(json);
