import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';


export type ToastType = 'success' | 'error' | 'info' | 'premium' | 'warning';

export interface ToastItem {
    id: string;
    title?: string;
    description?: string;
    message?: string;
    type: ToastType;
    duration: number;
}

export const toastsAtom = atom<ToastItem[]>([]);

// Helper to add a toast via atom (outside of React if needed, though useSetAtom is preferred)
export const addToastAtom = atom(
    null,
    (get, set, toast: Omit<ToastItem, 'id'>) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newItem = { ...toast, id };
        set(toastsAtom, (prev) => [...prev, newItem]);
        
        setTimeout(() => {
            set(toastsAtom, (prev) => prev.filter(t => t.id !== id));
        }, toast.duration);
    }
);

// 🏛️ PERSISTENT UI STATE
export const isSidebarCollapsedAtom = atomWithStorage('nexus_sidebar_collapsed', false);
export const isLaunchpadOpenAtom = atom(false);
export const themeAtom = atomWithStorage<'light' | 'dark'>('nexus_theme', 'dark');
export const isTrainingModeAtom = atomWithStorage('nexus_training_mode', false);

import { Notification as AppNotification } from '@/types';
export type { AppNotification as Notification };

// 🔔 NOTIFICATIONS STATE
export const notificationsAtom = atom<AppNotification[]>([]);
export const unreadNotificationsCountAtom = atom((get) => get(notificationsAtom).filter(n => !n.read).length);

// 🕹️ COMMAND PALETTE STATE
export const isCommandOpenAtom = atom(false);
// 📱 MOBILE & DOCS STATE
export const isMobileMenuOpenAtom = atom(false);
export const isDocsOpenAtom = atom(false);
export const isMap3DOpenAtom = atom(false);
export const performanceModeAtom = atomWithStorage('nexus_performance_mode', false);
