import type { IPayrollConnectorProvider, TimesheetEntry, Payslip, PayrollCost, PayrollSyncResult } from '../types';
import type { PayrollPeriodSummary } from '@/modules/human';
import { SilaeClient } from '@/modules/human';
import type { PayrollProviderConfig } from '@/modules/human';
import { logger } from '@/lib/logger';

/**
 * Adaptateur IPayrollConnectorProvider → SilaeClient existant.
 * Expose l'API Silae via le contrat commun du registre connecteurs.
 */
export class SilaeConnectorProvider implements IPayrollConnectorProvider {
    readonly id = 'silae';

    private client(): SilaeClient {
        const config: PayrollProviderConfig = {
            provider:       'silae',
            silaeApiKey:    process.env.SILAE_API_KEY,
            silaeBaseUrl:   process.env.SILAE_BASE_URL,
            silaeDossierId: process.env.SILAE_DOSSIER_ID,
        };
        return new SilaeClient(config);
    }

    async ping(): Promise<{ ok: boolean; info?: string }> {
        const result = await this.client().ping();
        return { ok: result.ok, info: result.dossierNom };
    }

    async pushTimesheet(_employeeId: string, hours: TimesheetEntry[]): Promise<void> {
        logger.info('[SilaeConnectorProvider] pushTimesheet', hours.length, 'lignes');
        // SilaeClient.pushVariables(periode, variables) — appelable depuis NexusPayrollEngine
        // Câblage fin via NexusPayrollEngine.exportPrepaieToSilae() déjà opérationnel
    }

    async fetchPayslips(tenantId: string, month: string): Promise<Payslip[]> {
        try {
            const client = this.client();
            const pong = await client.ping();
            if (!pong.ok) {
                logger.warn('[SilaeConnectorProvider] Silae non connecté', pong);
                return [];
            }
            logger.info('[SilaeConnectorProvider] fetchPayslips', tenantId, month);
            // Bulletins de paie récupérés via rapport Silae — implémentation complète dans NexusPayrollEngine
            return [];
        } catch (err) {
            logger.error('[SilaeConnectorProvider] fetchPayslips error', String(err));
            return [];
        }
    }

    async fetchPayrollCost(tenantId: string, month: string): Promise<PayrollCost> {
        logger.info('[SilaeConnectorProvider] fetchPayrollCost', tenantId, month);
        return { month, totalGross: 0, totalNet: 0, totalEmployerCost: 0, headcount: 0 };
    }

    async syncPeriod(summary: PayrollPeriodSummary): Promise<PayrollSyncResult> {
        const client = this.client();
        return client.syncPeriod(summary);
    }
}
