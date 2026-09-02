/**
 * 🛡️ InstanceGuard - Global Sovereignty Service (Grade VI)
 * Validates the current deployment host against authorized domains.
 * Prevents code unauthorized extraction and cross-tenant leakage.
 */

import { logger } from '@/lib/logger';

export interface InstanceSecurityConfig {
    authorizedDomains: Record<string, string>; // hostname -> tenantId
    authorizedProjects: Record<string, string>; // tenantId -> firebaseProjectId
    allowDevMode: boolean;
}

export const DEFAULT_SECURITY_CONFIG: InstanceSecurityConfig = {
    authorizedDomains: {
        'lepetitpoucet.com': 'lepetitpoucet',
        'kitchen-os.app': 'restaurant-os',
        // --- 🛰️ Firebase Hosting Standard ---
        'kitchen-os-lepetitpoucet.web.app': 'lepetitpoucet',
        'restaurant-os-web.web.app': 'restaurant-os',
        'restaurant-os-web.firebaseapp.com': 'restaurant-os',
        // --- 🛠️ Localhost / Dev ---
        'localhost': '__dev__',
        '127.0.0.1': '__dev__',
    },
    authorizedProjects: {
        'lepetitpoucet': 'lepetitpoucet-prod',
        'restaurant-os': 'kitchen-os-gastro', // FIXED
        '__dev__': 'kitchen-os-gastro'
    },
    allowDevMode: process.env.NODE_ENV === 'development',
};

export class InstanceGuard {
    private static config = DEFAULT_SECURITY_CONFIG;

    /**
     * Valide l'instance complète (Host + Project) et retourne le tenantId ou 'UNAUTHORIZED'.
     */
    static validateInstance(hostname: string, firebaseProjectId: string): string {
        const tenantId = this.config.authorizedDomains[hostname];

        if (!tenantId) {
            // Mode Dev Bypass
            if (this.config.allowDevMode && (hostname === 'localhost' || hostname === '127.0.0.1')) {
                return '__dev__';
            }
            return 'UNAUTHORIZED';
        }

        // 🛡️ VANGUARD SECURITY: Cross-check Project ID
        const expectedProjectId = this.config.authorizedProjects[tenantId];
        if (expectedProjectId !== firebaseProjectId) {
            logger.error(`🚨 SOUVEREIGNTY_VIOLATION: Host ${hostname} (Tenant: ${tenantId}) attempted to boot with Project ID ${firebaseProjectId}. Expected: ${expectedProjectId}`);
            return 'UNAUTHORIZED';
        }

        return tenantId;
    }

    /**
     * Vérifie si l'instance est sécurisée (Compatibilité descendante).
     */
    static isAuthorized(hostname: string): boolean {
        return !!this.config.authorizedDomains[hostname] || (this.config.allowDevMode && (hostname === 'localhost' || hostname === '127.0.0.1'));
    }
}
