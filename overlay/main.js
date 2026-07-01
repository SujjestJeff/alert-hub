const token = new URLSearchParams(location.search).get("token") || "";
const el = document.getElementById("alert");
const source = new EventSource(`/events?token=${encodeURIComponent(token)}`);

source.addEventListener("alert", (e) => render(JSON.parse(e.data)));

function render(alert) {
  el.textContent = describe(alert);
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.add("hidden");
    fetch(`/events/done?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alert.id }),
    });
  }, 4000);
}

function describe(a) {
  switch (a.kind) {
    case "follow": return `${a.displayName} followed!`;
    case "subscription": return `${a.displayName} subscribed (Tier ${a.tier})`;
    case "resub": return `${a.displayName} resubbed - ${a.months} months!`;
    case "gift": return `${a.displayName} gifted ${a.count} sub${a.count === a ? "" : "s"}!`;
    case "cheer": return `${a.displayName} cheered ${a.bits} bits!`;
    case "raid": return `${a.displayName} raided with ${a.count}!`;
    default: return "New alert!";
  }
}
