'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UsePushSubscriptionReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Hook: Web Push subscription lifecycle.
 *
 * - Registers /sw.js on mount when the browser supports Service Workers.
 * - subscribe() calls PushManager.subscribe() with the VAPID public key,
 *   then POSTs the resulting subscription to /api/push/subscribe.
 * - unsubscribe() calls sub.unsubscribe() on the active PushSubscription.
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // -------------------------------------------------------------------------
  // On mount: feature-detect and register the SW
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    navigator.serviceWorker
      .register('/sw.js')
      .then(async reg => {
        setRegistration(reg);
        const existing = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existing);
      })
      .catch(err => {
        logger.error('[usePushSubscription] SW registration failed', err);
      });
  }, []);

  // -------------------------------------------------------------------------
  // subscribe
  // -------------------------------------------------------------------------
  const subscribe = useCallback(async () => {
    if (!registration) {
      toast.error('Service Worker not ready. Please try again.');
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error('Push notifications are not configured (missing VAPID key).');
      logger.warn('[usePushSubscription] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
      return;
    }

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      setIsSubscribed(true);

      // Persist subscription server-side
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      toast.success('Push notifications enabled.');
    } catch (err) {
      logger.error('[usePushSubscription] subscribe() failed', err);
      toast.error('Failed to enable push notifications.');
    }
  }, [registration]);

  // -------------------------------------------------------------------------
  // unsubscribe
  // -------------------------------------------------------------------------
  const unsubscribe = useCallback(async () => {
    if (!registration) return;

    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success('Push notifications disabled.');
    } catch (err) {
      logger.error('[usePushSubscription] unsubscribe() failed', err);
      toast.error('Failed to disable push notifications.');
    }
  }, [registration]);

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}

// ---------------------------------------------------------------------------
// Utility: convert VAPID public key (URL-safe base64) to Uint8Array
// ---------------------------------------------------------------------------
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}
