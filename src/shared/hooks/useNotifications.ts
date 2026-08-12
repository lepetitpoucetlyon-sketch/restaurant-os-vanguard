"use client";

import { useNexusCore } from '@/kernel/providers/NexusCoreContext';

/**
 * 🔔 useNotifications - Grade X
 * Direct bridge to the Nexus Core Notifications state.
 */
export function useNotifications() {
    const core = useNexusCore();
    return core.notif;
}
