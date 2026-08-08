import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * BCGActionSuggestionHandler (P1-4.7)
 * Écoute `intelligence.bcg_calculated`.
 * Génère des recommandations concrètes d'optimisation de la carte (retrait des "Poids Morts", hausse de prix des "Dilemmes").
 */
export function registerBCGActionSuggestionHandler(): () => void {
  return NexusEventBus.on(
    'intelligence.bcg_calculated',
    async (payload) => {
      const { tenantId, dogs, plowhorses, stars, puzzles } = payload;
      const suggestionId = Nexus.adapter.generateId(`tenants/${tenantId}/menuSuggestions`);

      try {
        logger.info(`[BCGActionSuggestionHandler] Analyse BCG terminée (${stars?.length ?? 0} Stars, ${dogs?.length ?? 0} Poids Morts).`);

        await Nexus.adapter.set(`tenants/${tenantId}/menuSuggestions/${suggestionId}`, {
          id: suggestionId,
          generatedAt: new Date().toISOString(),
          dogsCount: dogs?.length ?? 0,
          plowhorsesCount: plowhorses?.length ?? 0,
          starsCount: stars?.length ?? 0,
          puzzlesCount: puzzles?.length ?? 0,
          recommendation: `Recommandation Carte : Réviser ou retirer ${dogs?.length ?? 0} plat(s) 'Poids Morts' et ajuster les portions/prix de ${plowhorses?.length ?? 0} plat(s).`,
        });

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Menu Engineering BCG : ${dogs?.length ?? 0} plat(s) à retravailler ou retirer de la carte.`,
          roles: ['directeur', 'super_admin'],
          priority: 'HIGH',
          metadata: { suggestionId, dogsCount: dogs?.length, starsCount: stars?.length },
        });

        empireAudit.log({
          module: 'system',
          action: 'BCG_SUGGESTIONS_GENERATED',
          details: { suggestionId, dogsCount: dogs?.length },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[BCGActionSuggestionHandler] Échec suggestions BCG`, toError(err).message);
      }
    },
    { id: 'bcg-action-suggestion-handler', priority: 'BACKGROUND' }
  );
}
