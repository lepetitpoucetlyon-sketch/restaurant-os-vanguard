/**
 * 🛡️ InstanceGuard - Global Sovereignty Service (Grade VI)
 * Validates the current deployment host against authorized domains.
 * Prevents code unauthorized extraction and cross-tenant leakage.
 */

export interface InstanceSecurityConfig {
    authorizedDomains: Record<string, string>; // hostname -> tenantId
    allowDevMode: boolean;
}

export const DEFAULT_SECURITY_CONFIG: InstanceSecurityConfig = {
    authorizedDomains: {
        'lepetitpoucet.com': 'lepetitpoucet',
        'bistrolyon.fr': 'bistrolyon',
        'urbanburger.io': 'urbanburger',
        'kitchen-os.app': 'restaurant-os',
        // --- 🛰️ Firebase Hosting Standard ---
        'kitchen-os-lepetitpoucet.web.app': 'lepetitpoucet',
        'kitchen-os-bistrolyon.web.app': 'bistrolyon',
        'kitchen-os-urbanburger.web.app': 'urbanburger',
        // --- 🛠️ Localhost / Dev ---
        'localhost': '__dev__',
        '127.0.0.1': '__dev__',
        '0.0.0.0': '__dev__',
    },
    allowDevMode: process.env.NODE_ENV === 'development',
};

export class InstanceGuard {
    private static config = DEFAULT_SECURITY_CONFIG;

    /**
     * Valide l'hôte actuel et retourne le tenantId associé ou 'UNAUTHORIZED'.
     */
    static validateHost(hostname: string): string {
        const tenantId = this.config.authorizedDomains[hostname];

        if (tenantId) {
            return tenantId;
        }

        // Mode Dev Bypass
        if (this.config.allowDevMode && (hostname === 'localhost' || hostname === '127.0.0.1')) {
            return '__dev__';
        }

        return 'UNAUTHORIZED';
    }

    /**
     * Vérifie si l'instance est sécurisée.
     */
    static isAuthorized(hostname: string): boolean {
        return this.validateHost(hostname) !== 'UNAUTHORIZED';
    }
}
