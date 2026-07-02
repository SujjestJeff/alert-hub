export const KIND_CLASS = {
  follow: "follow", subscription: "sub", resub: "sub",
  gift: "gift", cheer: "cheer", raid: "raid",
};

export function makeSampleAlert(kind) {
  const base = { id: `sample-${kind}`, kind, displayName: "TestUser", createdAt: Date.now() };
  switch (kind) {
    case "subscription": return { ...base, tier: 1 };
    case "resub": return { ...base, tier: 1, months: 6, message: "Sample resub message!" };
    case "gift": return { ...base, tier: 1, count: 5 };
    case "cheer": return { ...base, bits: 500, message: "Sample cheer!" };
    case "raid": return { ...base, count: 42 };
    default: return base;
  }
}
