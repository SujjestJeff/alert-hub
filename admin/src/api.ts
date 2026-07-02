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
