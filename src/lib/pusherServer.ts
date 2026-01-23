import Pusher from "pusher";

let cached: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (cached) return cached;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error("Pusher is not configured");
  }

  cached = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return cached;
}

export function notificationsChannelForUser(userId: string) {
  return `private-notifications-${userId}`;
}
