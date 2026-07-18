// TODO: Install web-push package for production VAPID signing: npm install web-push
// The sendToUser method below builds the push request manually via fetch().
// For production, replace the manual JWT construction with:
//   import webPush from 'web-push';
//   webPush.setVapidDetails('mailto:...', publicKey, privateKey);
//   await webPush.sendNotification(subscription, JSON.stringify(payload));

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

/**
 * Server-side Web Push helper.
 *
 * VAPID note: full VAPID JWT signing requires the `web-push` npm package.
 * Until it is installed, sendToUser logs a TODO and skips the actual delivery.
 * The subscription storage and retrieval paths are fully functional.
 */
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
    const record = await Nexus.adapter.get<PushSubscriptionRecord>(
      `pushSubscriptions/${userId}`
    );

    if (!record) {
      logger.warn(`[WebPushService] No subscription found for user ${userId}`);
      return;
    }

    let sub: PushSubscription;
    try {
      sub = JSON.parse(record.subscription) as PushSubscription;
    } catch {
      logger.error(
        `[WebPushService] Failed to parse subscription for user ${userId}`
      );
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      // TODO: Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars,
      // then replace this block with web-push.sendNotification() for full VAPID support.
      logger.warn(
        '[WebPushService] VAPID keys not configured — skipping push delivery. ' +
          'Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, then install web-push.'
      );
      return;
    }

    // TODO: Replace the manual fetch below with `web-push` once installed.
    // The Web Push Protocol requires a VAPID JWT signed with ES256; building it
    // manually with Web Crypto is possible but error-prone. Using the `web-push`
    // package (npm install web-push) is strongly recommended for production.
    try {
      const response = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Placeholder — real VAPID auth header must be signed JWT:
          // Authorization: `vapid t=<jwt>,k=<urlsafe-base64-public-key>`
          Authorization: `vapid t=TODO_SIGN_JWT,k=${vapidPublicKey}`,
          TTL: '86400',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error(
          `[WebPushService] Push delivery failed for ${userId}: ${response.status}`
        );
      } else {
        logger.info(`[WebPushService] Push sent to user ${userId}`);
      }
    } catch (err) {
      logger.error(`[WebPushService] Network error sending push to ${userId}`, err);
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
