import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

/**
 * 🕵️ C4.5: Fraud Detection Model - Grade X
 * Analyse les événements d'audit (via heuristiques ou IA) pour détecter des comportements suspects.
 */
export class FraudDetectionModel {
    
    /**
     * Analyse un opérateur spécifique sur une période donnée (ex: la journée).
     * Si des motifs de fraude sont détectés (ex: trop de voids après impression, skims massifs),
     * une alerte est levée.
     */
    static async analyzeOperatorBehavior(tenantId: string, operatorId: string, dateStr: string): Promise<void> {
        logger.info(`[FraudDetection] Analyse de l'opérateur ${operatorId} pour la journée du ${dateStr}...`);
        
        try {
            // 1. Récupération des logs d'audit
            // Dans un vrai système, on interrogerait le LightRAG ou une DB vectorielle
            const auditLogs = await Nexus.adapter.get<Record<string, { action: string, timestamp: string, details: Record<string, unknown> }>>(
                `tenants/${tenantId}/empireAudit`
            ) || {};
            
            let voidCount = 0;
            let discountCount = 0;
            let totalTransactions = 0;

            for (const log of Object.values(auditLogs)) {
                // Filtrage naïf pour l'exemple (en prod, indexation forte par operateur/date)
                if (log.details?.operatorId === operatorId && log.timestamp.startsWith(dateStr)) {
                    totalTransactions++;
                    if (log.action === 'ORDER_ITEM_VOIDED') voidCount++;
                    if (log.action === 'ORDER_DISCOUNT_APPLIED') discountCount++;
                }
            }

            // 2. Moteur Heuristique de Détection
            const VOID_THRESHOLD = 0.10; // 10% des actions = annulations -> très suspect
            
            if (totalTransactions > 20 && (voidCount / totalTransactions) > VOID_THRESHOLD) {
                const fraudProbability = Math.round((voidCount / totalTransactions) * 100);
                logger.warn(`[FraudDetection] 🚨 Comportement suspect pour ${operatorId}. Voids: ${voidCount}/${totalTransactions} (${fraudProbability}%)`);

                // 3. Action : Alerte silencieuse (on ne bloque pas le POS, on notifie le management)
                empireAudit.log({
                    module: 'finance',
                    action: 'POTENTIAL_FRAUD_DETECTED',
                    details: { 
                        operatorId, 
                        reason: 'HIGH_VOID_RATE', 
                        voidCount, 
                        totalTransactions,
                        fraudProbability 
                    },
                    severity: 'high',
                    timestamp: new Date(),
                });

                // Émission d'un event système pour réveiller le dashboard du directeur
                // Note : On ne fait pas de sovereign.breach ici car ce n'est pas une fuite de données inter-tenant, 
                // c'est un problème RH/Vol interne.
                await NexusEventBus.emitDurable('support.ticket_submitted', {
                    v: 1,
                    ticketId: `fraud-${Date.now()}`,
                    tenantId,
                    description: `Activité suspecte détectée: L'opérateur ${operatorId} a un taux d'annulation anormalement élevé (${fraudProbability}%).`,
                    submittedBy: 'SYSTEM_FRAUD_AI'
                });
            }
            
        } catch (e) {
            logger.error('[FraudDetection] Échec de l\'analyse de fraude', e);
            throw e;
        }
    }
}
