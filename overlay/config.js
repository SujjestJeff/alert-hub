export const DEFAULT_CONFIG = {
  follow: { template: "{name} just followed!", sound: "/overlay/sounds/follow.ogg", cssClass: "follow", holdMs: 3000 },
  subscription: { template: "{name} subscribed! (Tier {tier})", sound: "/overlay/sounds/sub.ogg", cssClass: "sub", holdMs: 4000 },
  resub: { template: "{name} resubbed - {months} months!", sound: "/overlay/sounds/sub.ogg", cssClass: "sub", holdMs: 4000 },
  gift: { template: "{name} gifted {count} subs!", sound: "/overlay/sounds/gift.ogg", cssClass: "gift", holdMs: 4500 },
  cheer: { template: "{name} cheered {bits} bits!", sound: "/overlay/sounds/cheer.ogg", cssClass: "cheer", holdMs: 3500 },
  raid: { template: "{name} raded with {count}", sound: "/overlay/sounds/raid.ogg", cssClass: "raid", holdMs: 5000 },
  default: { template: "New alert!", sound: null, cssClass: "", holdMs: 3000 },
}
