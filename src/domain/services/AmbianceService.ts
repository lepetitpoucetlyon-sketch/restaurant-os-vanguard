// @ts-nocheck
import { logger } from '@/lib/axiom';

export type RestaurantAmbiance = 'SERENITY' | 'RUSH_SPEED' | 'ELEGANCE_NIGHT';

/**
 * 🕯️ AmbianceService - The Emotional Brain of the Empire
 * Adapts the UI "Soul" based on restaurant context and time of day.
 */
export class AmbianceService {
    private static manualOverride: RestaurantAmbiance | null = null;
    
    /**
     * Set a manual override for the ambiance (e.g. from the UI Switcher)
     */
    static setManualAmbiance(ambiance: RestaurantAmbiance | null) {
        this.manualOverride = ambiance;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ambiance-changed', { detail: ambiance }));
        }
    }

    /**
     * Calculates the ideal ambiance based on time and current fleet metrics
     */
    static getCurrentAmbiance(): RestaurantAmbiance {
        if (this.manualOverride) return this.manualOverride;

        const hour = new Date().getHours();
        
        // 8 AM - 11:30 AM: Breakfast / Prep
        if (hour >= 8 && hour < 11.5) {
            return 'SERENITY';
        }
        
        // 11:30 AM - 3 PM: Lunch Rush
        // 6:30 PM - 9:30 PM: Dinner Peak
        if ((hour >= 11.5 && hour < 15) || (hour >= 18.5 && hour < 21.5)) {
            return 'RUSH_SPEED';
        }
        
        // Late Night / Evening
        return 'ELEGANCE_NIGHT';
    }

    /**
     * Returns the "Guardian Angel" notification filter level
     * 0: Noise Allowed, 1: Filtered, 2: Critical Only (Rush)
     */
    static getNotificationPriorityThreshold(): number {
        const ambiance = this.getCurrentAmbiance();
        switch (ambiance) {
            case 'RUSH_SPEED': return 2; // During rush, only critical system/stock alerts
            case 'SERENITY': return 0;   // Morning: allow marketing/sync/tutorial alerts
            default: return 1;
        }
    }

    /**
     * Visual Tokens for the current ambiance
     */
    static getThemeTokens() {
        const ambiance = this.getCurrentAmbiance();
        
        const tokens = {
            SERENITY: {
                primary: '#6366f1', // Indigo
                background: '#0a0a0b',
                surface: '#161618',
                accent: '#818cf8',
                blur: 'backdrop-blur-xl',
                animationMultiplier: 1.0,
                name: 'Serenity'
            },
            RUSH_SPEED: {
                primary: '#10b981', // Emerald (Speed & Clarity)
                background: '#000000',
                surface: '#0f172a',
                accent: '#34d399',
                blur: 'none', // Max performance, no expensive blurs
                animationMultiplier: 0.5, // Animations are 2x faster
                name: 'Rush Mode'
            },
            ELEGANCE_NIGHT: {
                primary: '#f59e0b', // Amber/Honey
                background: '#050505',
                surface: '#121212',
                accent: '#fbbf24',
                blur: 'backdrop-blur-2xl',
                animationMultiplier: 1.2, // Smoother, slower transitions
                name: 'Elegance'
            }
        };

        return tokens[ambiance];
    }
}
