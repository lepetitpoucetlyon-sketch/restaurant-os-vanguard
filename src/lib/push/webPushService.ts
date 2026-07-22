import webPush from 'web-push';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface PushSubscriptionRecord {
  userId: string;
  subscription: string; // JSON-serialised PushSubscription
  updatedAt: number;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface UserRecord {
  role?: string;
  [key: string]: unknown;
}

function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

export class WebPushService {
  // ---------------------------------------------------------------------------
  // saveSubscription
  // ---------------------------------------------------------------------------
  static async saveSubscription(
    userId: string,
    sub: PushSubscription
  ): Promise<void> {
    const record: PushSubscriptionRecord = {
      userId,
      subscription: JSON.stringify(sub),
      updatedAt: Date.now(),
    };
    await Nexus.adapter.set(`pushSubscriptions/${userId}`, record);
    logger.info(`[WebPushService] Subscription saved for user ${userId}`);
  }

  // ---------------------------------------------------------------------------
  // sendToUser
  // ---------------------------------------------------------------------------
  static async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const keys = getVapidKeys();
    if (!keys) {
      logger.warn('[WebPushService] VAPID keys not configured — skipping push delivery');
      return;
    }

    const record = await Nexus.adapter.get<PushSubscriptionRecord>(
      `pushSubscriptions/${userId}`
    );
    if (!record) {
      logger.warn(`[WebPushService] No subscription found for user ${userId}`);
      return;
    }

    let sub: webPush.PushSubscription;
    try {
      sub = JSON.parse(record.subscription) as webPush.PushSubscription;
    } catch {
      logger.error(`[WebPushService] Failed to parse subscription for user ${userId}`);
      return;
    }

    webPush.setVapidDetails(
      'mailto:contact@restaurant-os.app',
      keys.publicKey,
      keys.privateKey
    );

    try {
      await webPush.sendNotification(sub, JSON.stringify(payload));
      logger.info(`[WebPushService] Push sent to user ${userId}`);
    } catch (err) {
      logger.error(`[WebPushService] Push delivery failed for ${userId}`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // sendToRole
  // ---------------------------------------------------------------------------
  static async sendToRole(role: string, payload: PushPayload): Promise<void> {
    const users = await Nexus.adapter.query<UserRecord & { id?: string }>('users', {
      where: [{ field: 'role', operator: '==', value: role }],
    });

    if (!users.length) {
      logger.warn(`[WebPushService] No users found with role "${role}"`);
      return;
    }

    await Promise.allSettled(
      users.map(user => {
        const userId =
          (user as { id?: string; userId?: string }).id ??
          (user as { id?: string; userId?: string }).userId;
        if (!userId) return Promise.resolve();
        return WebPushService.sendToUser(userId, payload);
      })
    );
  }
}
