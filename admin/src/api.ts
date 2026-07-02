export class Unauthorized extends Error { }

async function json(res: Response) {
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

export const getConfig = () => fetch("/admin/api/config", { credentials: "include" }).then(json);

export const login = (password: string) =>
  fetch("/admin/login", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  }).then((r) => r.ok);

export const saveAlert = (kind: string, patch: unknown) =>
  fetch(`/admin/api/config/${kind}`, {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then(json);

export const getOverlayToken = () =>
  fetch("/admin/api/overlay-token", { credentials: "include" }).then(json);

export const getOverlayConfig = (token: string) =>
  fetch(`/overlay/config?token=${encodeURIComponent(token)}`).then((r) => r.json());

export const fireTestAlert = (kind: string) =>
  fetch("/admin/api/test-alert", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  }).then(json);
