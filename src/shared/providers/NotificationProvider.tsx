"use client";
import React, { createContext, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
    notificationsAtom,
    unreadNotificationsCountAtom,
    addToastAtom
} from '@nexus/state/SovereignGenome';
import type { NexusNotifState } from '@nexus/contracts/nexus.types';
import type { Notification as AppNotification } from '@nexus/contracts';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { isMCCMode } from '@/config/instance';
import { logger } from '@/lib/logger';

/**
 * Forme brute persistée par NotificationCreatedHandler dans
 * `tenants/{id}/notifications/{id}` — volontairement plus large que le contrat
 * `Notification` (elle porte `priority`, `occurrences`, `lastSeenAt`…).
 */
interface PersistedNotification {
    id: string;
    type?: string;
    title?: string;
    message?: string;
    priority?: string;
    read?: boolean;
    timestamp?: string;
    occurrences?: number;
    module?: string;
    action?: { label: string; href?: string };
}

/** Normalise un document persisté vers la forme attendue par le centre de notifications. */
function toAppNotification(doc: PersistedNotification): AppNotification {
    return {
        id: doc.id,
        type: (doc.type ?? 'info') as AppNotification['type'],
        title: doc.title ?? '',
        message: doc.message ?? '',
        read: doc.read ?? false,
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        module: doc.module,
        action: doc.action,
        createdAt: doc.timestamp ?? new Date().toISOString(),
        updatedAt: doc.timestamp ?? new Date().toISOString(),
    } as AppNotification;
}

export const NotificationContext = createContext<NexusNotifState | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const notifications = useAtomValue(notificationsAtom);
    const unreadCount = useAtomValue(unreadNotificationsCountAtom);
    const addToast = useSetAtom(addToastAtom);
    const setNotifications = useSetAtom(notificationsAtom);
    const tenantId = useAtomValue(tenantIdAtom) as string | null;

    // ── Correctif N0-1 : hydratation du centre de notifications ──────────────
    // Le centre lisait un atome jamais alimenté. On s'abonne à la collection
    // Nexus que NotificationCreatedHandler écrit déjà, et on projette dans l'atome.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isMCCMode()) return;              // le MCC n'a pas de notifications tenant
        if (!tenantId) return;

        const path = `tenants/${tenantId}/notifications`;
        const unsubscribe = Nexus.adapter.onSnapshot<PersistedNotification[]>(
            path,
            (docs) => {
                const list = (Array.isArray(docs) ? docs : [])
                    .filter((d) => d && d.id)
                    .map(toAppNotification)
                    .sort((a, b) => {
                        const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
                        const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
                        return tb - ta; // plus récent d'abord
                    });
                setNotifications(list);
            },
            {
                onError: (error: Error) =>
                    logger.error('[NotificationProvider] Échec de la synchronisation des notifications', error),
            }
        );

        return () => {
            try { unsubscribe?.(); } catch { /* no-op */ }
        };
    }, [tenantId, setNotifications]);

    // ── Correctif N0-2 : actions réelles (fin des souches logger.debug) ───────
    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        if (tenantId) {
            Nexus.adapter
                .update(`tenants/${tenantId}/notifications/${id}`, { read: true })
                .catch((err) => logger.error(`[NotificationProvider] markAsRead échec (${id})`, err));
        }
    }, [tenantId, setNotifications]);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        if (!tenantId) return;
        // Ne persister que celles réellement non lues (limite les écritures).
        for (const n of notifications.filter((x) => !x.read)) {
            Nexus.adapter
                .update(`tenants/${tenantId}/notifications/${n.id}`, { read: true })
                .catch((err) => logger.error(`[NotificationProvider] markAllAsRead échec (${n.id})`, err));
        }
    }, [tenantId, notifications, setNotifications]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (tenantId) {
            Nexus.adapter
                .delete(`tenants/${tenantId}/notifications/${id}`)
                .catch((err) => logger.error(`[NotificationProvider] removeNotification échec (${id})`, err));
        }
    }, [tenantId, setNotifications]);

    const clearAll = useCallback(() => {
        const ids = notifications.map((n) => n.id);
        setNotifications([]);
        if (!tenantId) return;
        for (const id of ids) {
            Nexus.adapter
                .delete(`tenants/${tenantId}/notifications/${id}`)
                .catch((err) => logger.error(`[NotificationProvider] clearAll échec (${id})`, err));
        }
    }, [tenantId, notifications, setNotifications]);

    const notifValue: NexusNotifState = useMemo(() => ({
        unreadCount,
        notifications: notifications as import('@nexus/contracts').Notification[],
        addNotification: (n: {
            type: import('@nexus/contracts/common.types').NotificationType;
            title: string;
            message: string;
            module?: string;
            action?: { label: string; href: string };
        }) => addToast({ ...n, duration: 3000 }),
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
    }), [unreadCount, notifications, addToast, markAsRead, markAllAsRead, removeNotification, clearAll]);

    return <NotificationContext.Provider value={notifValue}>{children}</NotificationContext.Provider>;
};
