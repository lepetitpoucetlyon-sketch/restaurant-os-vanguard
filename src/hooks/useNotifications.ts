import { useAtom, useAtomValue } from 'jotai';
import { notificationsAtom, unreadNotificationsCountAtom } from '@/store/uiAtoms';
import type { Notification as AppNotification } from '@nexus/contracts';

/**
 * 🔔 useNotifications - Grade VI
 * Gestion atomique des notifications système.
 */
export function useNotifications() {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const unreadCount = useAtomValue(unreadNotificationsCountAtom);

    const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: AppNotification = {
            ...notif,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => setNotifications([]);

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    };
}
