import { MasterBridge } from '@/lib/MasterBridge';
import { DEFAULT_TENANT_ID, APP_MODE } from '@/config/instance';

/**
 * Abonne le tenant vassal au flux MasterBridge si nécessaire.
 * Les tenants MCC (mode 'mcc') écrivent uniquement dans masterConfig, ils n'écoutent pas.
 * Retourne la fonction de désabonnement, ou null si aucun listener activé.
 */
export function initMasterBridgeListener(
    tenantId: string,
    store: Parameters<typeof MasterBridge.listenToMaster>[0],
): (() => void) | null {
    if (
        APP_MODE === 'tenant' &&
        tenantId !== 'restaurant-os' &&
        tenantId !== DEFAULT_TENANT_ID &&
        tenantId !== 'vanguard'
    ) {
        return MasterBridge.listenToMaster(store);
    }
    return null;
}
