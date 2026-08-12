import { SelfHealingEngine } from '@lib/services/SelfHealingEngine';
import { ordersNodeAtom } from '@/store/pillars/ops';

/**
 * Démarre l'intervalle de self-healing toutes les 60s.
 * Retourne un NodeJS.Timeout à clearInterval() au stopAll().
 */
export function startSelfHealingInterval(tenantId: string): NodeJS.Timeout {
    return setInterval(() => {
        SelfHealingEngine.auditAndHeal(
            ordersNodeAtom,
            'legacy_audit',
            `tenants/${tenantId}/orders`,
        ).catch(() => {});
    }, 60_000);
}
