export function applyTemplate(tpl, alert) {
  const view = { name: alert.displayName, ...alert };
  return tpl.replace(/\{(\w+)\}/g, (_, key) => (view[key] == null ? "" : String(view[key])));
}
