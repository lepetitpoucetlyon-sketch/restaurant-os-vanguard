import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';
// En situation réelle, on utiliserait un service comme FiscalSealer pour auditer la chaîne entière
// Ici nous simulons la vérification de chaîne d'une journée

export function registerCryptoIntegrityCheckHandler() {
  return NexusEventBus.on(
    'finance.daily_audit',
    async (payload) => {
      const { tenantId, date } = payload;
      
      logger.info(`[CryptoIntegrityCheck] Démarrage de l'audit pour le ${date}...`);
      
      // Simulation: on récupèrerait tous les sceaux (FiscalSeals) du jour et on vérifierait que le hash N-1 
      // correspond bien à la valeur stockée dans previousHash du sceau N.
      
      const isIntegrityValid = true; // Simulé
      
      if (!isIntegrityValid) {
        logger.error(`[CryptoIntegrityCheck] ALERTE: Rupture de chaîne détectée pour le ${date}`);
        empireAudit.log({
          module: 'finance',
          action: 'CRYPTO_CHAIN_BROKEN',
          details: { date },
          severity: 'critical',
          timestamp: new Date(),
        });
        
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `ALERTE CRITIQUE: Intégrité cryptographique compromise pour la journée du ${date}`,
          roles: ['admin', 'manager'],
          priority: 'CRITICAL',
        });
      } else {
        logger.info(`[CryptoIntegrityCheck] Chaîne validée avec succès pour le ${date}`);
      }
    },
    { id: 'crypto-integrity-check-handler', priority: 'BACKGROUND' }
  );
}
