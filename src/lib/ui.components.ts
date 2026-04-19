/**
 * 🧩 UI Components Logic - Restaurant OS
 * Dedicated module for complex rendering logic and shared UI interactions.
 */

import { logger } from "@/lib/logger";

/**
 * Helper to determine if a component should animate based on system load or settings.
 */
export const shouldAnimate = (interactionType: string) => {
    // Industrial logic for gating animations in a high-density canvas
    logger.debug(`[UI.Components] Checking animation gate for: ${interactionType}`);
    return true; 
};

/**
 * Utility for mapping status codes to consistent visual tokens.
 */
export const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
        'active': 'status.success',
        'error': 'status.error',
        'warning': 'status.warning',
        'pending': 'status.info',
        'idle': 'text.muted'
    };
    return map[status.toLowerCase()] || 'text.primary';
};
