"use client";
import React, { createContext, useMemo, ReactNode } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { 
    notificationsAtom, 
    unreadNotificationsCountAtom, 
    addToastAtom 
} from '@nexus/state/SovereignGenome';
import type { NexusNotifState } from '@nexus/contracts/nexus.types';
import { logger } from '@/lib/logger';

export const NotificationContext = createContext<NexusNotifState | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const notifications = useAtomValue(notificationsAtom);
    const unreadCount = useAtomValue(unreadNotificationsCountAtom);
    const addToast = useSetAtom(addToastAtom);

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
        markAsRead: (id: string) => logger.debug('Mark as read', id),
        markAllAsRead: () => logger.debug('Mark all read'),
        removeNotification: (id: string) => logger.debug('Remove notification', id),
        clearAll: () => logger.debug('Clear all notifications')
    }), [unreadCount, notifications, addToast]);

    return <NotificationContext.Provider value={notifValue}>{children}</NotificationContext.Provider>;
};
