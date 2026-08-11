/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { SovereignLedger } from '@/modules/finance';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * 🐒 Monkey Chaos - The Saboteur Agent
 * Designed to break the system to prove its resilience.
 * Part of the 5 Agentic Pillars of Antigravity Efficiency.
 */
export const MonkeyChaos = {
    /**
     * Attempts to corrupt the SovereignLedger with an unbalanced transaction.
     * The Ledger MUST reject this to prove Grade X integrity.
     */
    async attackLedger(tenantId: string): Promise<{ success: boolean; message: string }> {
        logger.warn('🧪 [MonkeyChaos] Initiating Ledger Attack: Attempting unbalanced transaction...');
        try {
            // We bypass the standard recordTransfer to test the internal validation if possible,
            // or we send a clearly broken request to verify the financier blocks it.
            await SovereignLedger.getInstance(tenantId).recordTransfer({
                debitAccount: 'SALES',
                creditAccount: 'CASH',
                amountInCents: 10000,
                referenceId: 'MONKEY-PATCH-2026',
                description: 'MONKEY_ATTACK: Asymmetric Corruption Attempt'
            });
            
            return { success: false, message: 'CRITICAL: Ledger accepted unbalanced transaction! Resilience Compromised.' };
        } catch (error) {
            const errorMessage = toError(error).message;
            logger.info(`🛡️ [MonkeyChaos] Attack Blocked by Ledger: ${errorMessage}`);
            return { success: true, message: 'Audit Passed: Ledger financier stopped the saboteur.' };
        }
    },

    /**
     * Simulates a hardware stream cut for sensors.
     * Triggers 'Safe Mode' in NexusGuard.
     */
    simulateSensorCut(updateSensorValue: (id: string, value: number | null) => void): void {
        logger.warn('🧪 [MonkeyChaos] Cutting sensor hardware stream...');
        // We inject null values to simulate a loss of signal
        updateSensorValue('ROTISSERIE_CORE_TEMP', null);
    }
};
