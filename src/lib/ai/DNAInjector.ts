import { getTenantConfig } from "@/instances";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from '@/lib/logger';

/**
 * 🧬 DNAInjector - Restaurant OS
 * Injecte l'intelligence métier spécifique (ADN) dans les prompts IA.
 */
export class DNAInjector {
    /**
     * Récupère l'ADN complet d'un tenant.
     * Priorité : Firestore (Dynamic) > Instance Config (Static)
     */
    static async getTenantDNA(tenantId: string): Promise<string> {
        try {
            // 1. Recherche dans Firestore (Règles dynamiques injectées via MCC)
            // Note: En mode Mock, cette étape sera sautée ou retournera un array vide.
            let dynamicRules: string[] = [];
            
            try {
                const results = await Nexus.adapter.query('tenant_knowledge', {
                    where: [{ field: 'tenantId', operator: '==', value: tenantId }]
                });
                dynamicRules = results.map(doc => doc.rule);
            } catch (err) {
                // Silencieusement ignorer en mode Mock / Sans clés
                logger.warn('DNAInjector: Firestore dynamic rules lookup failed (Normal in Mock Mode)');
            }

            // 2. Recherche dans la config statique (Fichiers .ts dans /instances)
            const staticConfig = getTenantConfig(tenantId);
            const staticRules = (staticConfig as import('@/instances').InstanceConfig)?.branding?.description || staticConfig?.name || "";

            // 3. Fusion et formatage pour l'IA
            const finalDNA = `
                IDENTITY & RULES FOR TENANT [${tenantId.toUpperCase()}]:
                - Basic Profile: ${staticRules}
                - Specialized Business Rules:
                  ${dynamicRules.length > 0 ? dynamicRules.join('\n- ') : "No active dynamic business rules."}
                
                You must follow these instructions strictly for this specific client.
            `;

            return finalDNA;
        } catch (error) {
            logger.error('DNAInjector: Failed to inject DNA', { tenantId, error });
            return "Default System DNA: No specific business rules available.";
        }
    }
}
