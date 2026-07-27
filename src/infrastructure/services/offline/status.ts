/**
 * 🛰️ Connectivity Status Utility
 * Safe for both Client and Server execution.
 */
export const checkOnlineStatus = (): boolean => {
    if (typeof window === 'undefined') return true;
    return window.navigator.onLine;
};
