export interface SubscriptionSpec {
  type: string;
  version: string;
  condition: Record<string, string>;
}

export function desiredSubscriptions(broadcasterId: string): SubscriptionSpec[] {
  const b = { broadcaster_user_id: broadcasterId };
  return [
    {
      type: "channel.follow", version: "2",
      condition: { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId }
    },
    { type: "channel.subscribe", version: "1", condition: b },
    { type: "channel.subscription.gift", version: "1", condition: b },
    { type: "channel.subscription.message", version: "1", condition: b },
    { type: "channel.cheer", version: "1", condition: b },
    {
      type: "channel.raid", version: "1",
      condition: { to_broadcaster_user_id: broadcasterId }
    },
  ]
}
