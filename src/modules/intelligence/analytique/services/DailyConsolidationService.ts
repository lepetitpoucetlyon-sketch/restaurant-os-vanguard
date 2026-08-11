import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { LaborCostAnalyzer } from '@/modules/human';

export interface DailyFlashReport {
    date: string;
    totalRevenueInCents: number;
    totalRevenueInMicrounits?: number;
    totalCovers: number;
    averageTicketInCents: number;
    averageTicketInMicrounits?: number;
    laborCostPercentage: number;
    foodCostPercentage: number;
    incidentsCount: number;
    topSellingItems: Array<{ name: string; quantity: number }>;
}

/**
 * 📊 C4.4: Daily Consolidation Service - Grade X
 * Construit le Flash Report quotidien du Directeur.
 */
export class DailyConsolidationService {
    
    /**
     * Génère le rapport pour la veille (ou le jour courant).
     */
    static async generateFlashReport(tenantId: string, dateStr: string): Promise<DailyFlashReport> {
        logger.info(`[FlashReport] Consolidation des données pour le ${dateStr}...`);
        
        try {
            // 1. Récupération des revenus (JournalEntries de type 'revenue')
            const revenueEntries = await Nexus.adapter.get<Record<string, { amountInMicrounits: number, type: string }>>(
                `tenants/${tenantId}/journalEntries`
            ) || {};
            
            // Simulation : filtrage par date et type (normalement indexé)
            let totalRevenueInMicrounits = 0;
            for (const entry of Object.values(revenueEntries)) {
                if (entry.type === 'revenue') {
                    totalRevenueInMicrounits += entry.amountInMicrounits || 0;
                }
            }
            const totalRevenueInCents = Math.round(totalRevenueInMicrounits / 10000);

            // 2. Récupération des commandes (pour les couverts et les produits phares)
            const orders = await Nexus.adapter.get<Record<string, { items: Array<{id: string; quantity: number}> }>>(
                `tenants/${tenantId}/orders`
            ) || {};
            
            let totalCovers = Object.keys(orders).length * 2.5; // Heuristique basique
            totalCovers = Math.round(totalCovers);
            
            const averageTicketInMicrounits = totalCovers > 0 ? Math.round(totalRevenueInMicrounits / totalCovers) : 0;
            const averageTicketInCents = Math.round(averageTicketInMicrounits / 10000);

            // Agrégation des produits vendus
            const itemCounts: Record<string, number> = {};
            for (const order of Object.values(orders)) {
                for (const item of (order.items || [])) {
                    itemCounts[item.id] = (itemCounts[item.id] || 0) + item.quantity;
                }
            }
            const topSellingItems = Object.entries(itemCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, quantity]) => ({ name, quantity }));

            // 3. Labor Cost
            const laborMetrics = await LaborCostAnalyzer.analyzeDailyLaborCost(tenantId, totalRevenueInCents);

            // 4. Incidents de la journée
            const auditLogs = await Nexus.adapter.get<Record<string, { severity: string, timestamp: number }>>(
                `tenants/${tenantId}/empireAudit`
            ) || {};
            
            let incidentsCount = 0;
            for (const log of Object.values(auditLogs)) {
                if (log.severity === 'high' || log.severity === 'critical') {
                    incidentsCount++;
                }
            }
            
            // 5. Food Cost
            const yieldData = await Nexus.adapter.get<{ currentFoodCostPct: number }>(
                `tenants/${tenantId}/inventory/yield`
            );
            const foodCostPercentage = yieldData?.currentFoodCostPct || 0;

            const report: DailyFlashReport = {
                date: dateStr,
                totalRevenueInCents,
                totalRevenueInMicrounits,
                totalCovers,
                averageTicketInCents,
                averageTicketInMicrounits,
                laborCostPercentage: Number(laborMetrics.laborCostPercentage.toFixed(1)),
                foodCostPercentage,
                incidentsCount,
                topSellingItems
            };

            // Sauvegarde du rapport pour historique
            await Nexus.adapter.set(`tenants/${tenantId}/flashReports/${dateStr}`, report);

            return report;
        } catch (e) {
            logger.error('[FlashReport] Échec de la consolidation', e);
            throw e;
        }
    }
}
