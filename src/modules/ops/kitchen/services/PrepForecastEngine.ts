import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface PrepItem {
    ingredientId: string;
    ingredientName: string;
    recommendedQuantity: number;
    unit: string;
    confidenceScore: number;
}

/**
 * 🔪 C4.3: Prep Forecast Engine - Grade X
 * Estime les quantités de mise en place (prep) à réaliser en croisant :
 * - Les réservations du lendemain
 * - Les historiques de vente (via ML/Heuristique basique ici)
 */
export class PrepForecastEngine {
    
    /**
     * Génère la feuille de prep pour une date donnée.
     */
    static async generatePrepList(tenantId: string, targetDate: string): Promise<PrepItem[]> {
        logger.info(`[PrepForecast] Génération de la prep pour le ${targetDate} (${tenantId})`);
        
        try {
            // 1. Lire les réservations du jour ciblé
            const reservations = await Nexus.adapter.get<Record<string, { covers: number }>>(
                `tenants/${tenantId}/reservations/${targetDate}`
            ) || {};
            
            const totalReservedCovers = Object.values(reservations).reduce((sum, r) => sum + r.covers, 0);

            // 2. Prévision de couverts spontanés (walk-ins) = +40% (basique)
            const projectedCovers = Math.round(totalReservedCovers * 1.4) || 50; // Fallback à 50 si pas de résa

            // 3. Modélisation de la matrice de menu (Menu Mix)
            // Dans un vrai système, on lirait le mix produit historique
            // Ici, simulation de 3 recettes phares
            const prepList: PrepItem[] = [
                {
                    ingredientId: 'ing_salmon',
                    ingredientName: 'Saumon Frais (Portions)',
                    recommendedQuantity: Math.round(projectedCovers * 0.3), // 30% prennent le saumon
                    unit: 'portions',
                    confidenceScore: 0.85
                },
                {
                    ingredientId: 'ing_beef',
                    ingredientName: 'Filet de Boeuf',
                    recommendedQuantity: Math.round(projectedCovers * 0.25), // 25% prennent le boeuf
                    unit: 'portions',
                    confidenceScore: 0.90
                },
                {
                    ingredientId: 'ing_potatoes',
                    ingredientName: 'Pommes Grenailles (Prep)',
                    recommendedQuantity: Math.round(projectedCovers * 0.55 * 0.2), // 55% de garniture à 200g
                    unit: 'kg',
                    confidenceScore: 0.95
                }
            ];

            return prepList;
        } catch (e) {
            logger.error('[PrepForecast] Échec de la génération', e);
            throw e;
        }
    }
}
