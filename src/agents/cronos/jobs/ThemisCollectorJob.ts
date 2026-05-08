import { CollectionService } from '@/domain/finance/collection/CollectionService';
import { InvoiceTarget } from '@/domain/finance/collection/types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';

/**
 * 🏛️ ThemisCollectorJob - Grade X+++
 * Tâche Cronos pour la relance automatique des impayés avec escalade.
 */
export const ThemisCollectorJob = {
    name: 'ThemisCollector',
    schedule: '0 8 * * *', // Tous les jours à 08h00 UTC
    
    /**
     * Exécute le batch de relances
     * @param getOverdueInvoices Fonction d'injection pour récupérer les factures
     */
    async execute(getOverdueInvoices: () => Promise<InvoiceTarget[]>) {
        try {
            const invoices = await getOverdueInvoices();
            
            // Exécution du service de collection Sovereign
            const actions = await CollectionService.processOverdueInvoices(invoices);
            
            NexusTelemetryService.emitAuditPulse('FINANCE', 'THEMIS_JOB_SUCCESS', {
                processedCount: actions.length
            });

            return {
                success: true,
                processedCount: actions.length,
                actions
            };
        } catch (error) {
            NexusTelemetryService.emitAuditPulse('FINANCE', 'THEMIS_JOB_FAILED', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
};
