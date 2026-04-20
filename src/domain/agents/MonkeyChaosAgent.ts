import { SovereignLedger } from '../services/SovereignLedger';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export type ChaosVector = 'ASSET_CORRUPTION' | 'SYNC_LATENCY' | 'GUARD_BYPASS';

export class MonkeyChaosAgent {
    private static isSimulating = false;
    private static attackInterval: NodeJS.Timeout | null = null;

    /**
     * Active le protocole Chaos. Seul l'Oracle peut invoquer le singe.
     */
    static activate(secretKey: string) {
        if (secretKey !== process.env.NEXT_PUBLIC_ORACLE_KEY) {
            logger.error('🚨 [MonkeyChaos] Unauthorized activation attempt blocked.');
            return;
        }
        
        this.isSimulating = true;
        logger.info('🐒 [MonkeyChaos] Protocol Activated. The monkey is loose.');
        this.scheduleNextAttack();
    }

    static deactivate() {
        this.isSimulating = false;
        if (this.attackInterval) clearInterval(this.attackInterval);
        logger.info('💤 [MonkeyChaos] Protocol Deactivated. The monkey is back in its cage.');
    }

    private static scheduleNextAttack() {
        const delay = Math.floor(Math.random() * (120000 - 30000 + 1)) + 30000; // 30s à 2min
        this.attackInterval = setTimeout(() => this.attack(), delay);
    }

    static async attack() {
        if (!this.isSimulating) return;

        const vectors: ChaosVector[] = ['ASSET_CORRUPTION', 'SYNC_LATENCY', 'GUARD_BYPASS'];
        const vector = vectors[Math.floor(Math.random() * vectors.length)];

        logger.warn(`🐒 [MonkeyChaos] Launching vector: ${vector}`);

        switch (vector) {
            case 'ASSET_CORRUPTION':
                await this.corruptLedger();
                break;
            case 'SYNC_LATENCY':
                this.injectSyncLatency();
                break;
            case 'GUARD_BYPASS':
                this.simulateGuardBypass();
                break;
        }

        this.scheduleNextAttack();
    }

    private static async corruptLedger() {
        try {
            // Tentative d'injection asymétrique (Sabotage)
            await SovereignLedger.recordTransfer({
                debitAccount: 'CASH',
                creditAccount: 'SALES',
                amountInCents: 10000,
                referenceId: 'CHAOS-666',
                description: 'Monkey Sabotage Attempt',
                _monkeyPatch: { forceAsymmetry: true }
            });
            logger.error('🔥 [FAILLE SOUVERAINE] Monkey corrupted the Ledger successfully.');
        } catch (e) {
            logger.info('🛡️ [Oracle Score +1] Ledger Inviolable: Sabotage blocked.');
        }
    }

    private static injectSyncLatency() {
        // Simule un ralentissement du NexusBridge
        (global as any).__NEXUS_LATENCY__ = 5000;
        logger.warn('🐌 [MonkeyChaos] Sync Latency injected (5000ms).');
        setTimeout(() => (global as any).__NEXUS_LATENCY__ = 0, 15000);
    }

    private static simulateGuardBypass() {
        logger.warn('🩹 [MonkeyChaos] Testing HACCP Guard Bypass...');
        // Logique de pilonnage des permissions
    }
}
