import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ClockEntry } from '@/modules/human/connectors/timeclock/types';

/**
 * 🧑‍🤝‍🧑 Local Liquid Staffing Engine (Human Pillar)
 * 
 * Brise les silos RH UNIQUEMENT entre les restaurants appartenant
 * AU MÊME PATRON (ownerId). 
 * Empêche formellement un employé du Client A d'être routé chez le Client B.
 */

export interface StaffingAnomaly {
    tenantId: string;
    ownerId: string; // GARANTIE DE SOUVERAINETÉ
    status: 'CRITICAL_SHORTAGE' | 'OVERSTAFFED';
    missingHeadcount: number;
    surplusHeadcount: number;
    recommendedAction: string;
}

export class LiquidStaffingEngine {

    /**
     * Analyse la grappe de restaurants D'UN SEUL PATRON pour détecter les déséquilibres RH.
     */
    public static async auditGroupStaffing(ownerId: string, groupTenantIds: string[]): Promise<StaffingAnomaly[]> {
        logger.info(`🔍 [Liquid Staffing] Audit RH intra-groupe pour le Owner ${ownerId}...`);
        
        const today = new Date().toISOString().slice(0, 10);
        const activeShiftsByTenant: Record<string, { currentStaff: number; requiredStaff: number }> = {};

        await Promise.all(groupTenantIds.map(async (tenantId) => {
            try {
                // Lire les pointages du jour (chemin canonique timeclock)
                const raw = await Nexus.adapter.get<Record<string, ClockEntry>>(
                    `tenants/${tenantId}/timeclock/${today}`
                );
                const entries = raw ? Object.values(raw) : [];

                // Employés actuellement en service : ont un clock_in sans clock_out ultérieur
                const clockedInIds = new Set<string>();
                const clockedOutIds = new Set<string>();
                for (const e of entries) {
                    if (e.type === 'clock_in')  clockedInIds.add(e.employeeId);
                    if (e.type === 'clock_out') clockedOutIds.add(e.employeeId);
                }
                const currentStaff = [...clockedInIds].filter(id => !clockedOutIds.has(id)).length;

                // Effectif requis : lu depuis les settings tenant, fallback à 3
                const settings = await Nexus.adapter.get<{ planningConfig?: { minStaff?: number } }>(
                    `tenants/${tenantId}/settings/global`
                );
                const requiredStaff = settings?.planningConfig?.minStaff ?? 3;

                activeShiftsByTenant[tenantId] = { currentStaff, requiredStaff };
            } catch (err) {
                logger.error(`[Liquid Staffing] Impossible de lire les pointages pour tenant=${tenantId}`, String(err));
                activeShiftsByTenant[tenantId] = { currentStaff: 0, requiredStaff: 3 };
            }
        }));

        const anomalies: StaffingAnomaly[] = [];

        for (const [tenantId, metrics] of Object.entries(activeShiftsByTenant)) {
            if (metrics.currentStaff < metrics.requiredStaff) {
                anomalies.push({
                    tenantId,
                    ownerId,
                    status: 'CRITICAL_SHORTAGE',
                    missingHeadcount: metrics.requiredStaff - metrics.currentStaff,
                    surplusHeadcount: 0,
                    recommendedAction: 'REQUEST_TRANSFER'
                });
            } else if (metrics.currentStaff > metrics.requiredStaff + 1) { 
                anomalies.push({
                    tenantId,
                    ownerId,
                    status: 'OVERSTAFFED',
                    missingHeadcount: 0,
                    surplusHeadcount: metrics.currentStaff - metrics.requiredStaff,
                    recommendedAction: 'OFFER_TRANSFER'
                });
            }
        }

        return anomalies;
    }

    /**
     * Tente de résoudre les anomalies en proposant des transferts inter-restaurants du MÊME groupe.
     */
    public static async orchestrateTransfers(anomalies: StaffingAnomaly[]): Promise<void> {
        const shortages = anomalies.filter(a => a.status === 'CRITICAL_SHORTAGE');
        const surpluses = anomalies.filter(a => a.status === 'OVERSTAFFED');

        for (const shortage of shortages) {
            // On cherche un sur-effectif CHEZ LE MÊME PATRON
            const provider = surpluses.find(s => s.ownerId === shortage.ownerId);

            if (provider) {
                logger.info(`🤝 [Liquid Staffing] MATCH INTRA-GROUPE : Déplacement de ${provider.tenantId} vers ${shortage.tenantId}`);
                
                // Notification au personnel du groupe via l'App RH
                NexusEventBus.emit('hr.transfer_offer', {
                    v: 1,
                    fromTenantId: provider.tenantId,
                    toTenantId: shortage.tenantId,
                    ownerId: shortage.ownerId, // Traçabilité stricte
                    headcount: 1, 
                    bonusInMicrounits: 15000000 // Le patron paie la prime
                });

                // Retire de la liste pour ne pas le vider complètement
                surpluses.splice(surpluses.indexOf(provider), 1);
            } else {
                logger.warn(`⚠️ [Liquid Staffing] Impossible de soulager ${shortage.tenantId} : Aucun autre restaurant du groupe n'est en sur-effectif.`);
            }
        }
    }
}
