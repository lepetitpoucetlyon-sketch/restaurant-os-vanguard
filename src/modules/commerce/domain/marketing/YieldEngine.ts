import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/lib/events/NexusEventBus';
import { SecurityGuard } from '@/domain/services/SecurityGuard';

/**
 * 📈 Local Yield Engine (Commerce Pillar)
 * 
 * Ce moteur appartient au CLIENT (B2B). Il permet au patron d'un ou plusieurs 
 * restaurants d'appliquer des stratégies de tarification dynamique sur SES établissements.
 * Il ne traverse JAMAIS l'isolation du SovereignGuard d'un autre client.
 */

export type YieldStrategyType = 'SURGE_PRICING' | 'FLASH_SALE' | 'AB_TEST';

export interface YieldCampaign {
    campaignId: string;
    type: YieldStrategyType;
    name: string;
    ownerId: string; // STRICT: Le patron qui lance la campagne
    targetTenantIds: string[]; // Ne peut cibler QUE ses propres restaurants
    rules: {
        productIdTarget?: string;
        categoryIdTarget?: string;
        priceModifierPercent: number; 
        startTimeMs: number;
        endTimeMs: number;
    };
    isAutopilot: boolean;
}

export class YieldEngine {
    /**
     * Le patron lance une campagne Yield sur sa grappe de restaurants.
     */
    public static async launchCampaign(campaign: YieldCampaign): Promise<void> {
        logger.info(`[B2B Yield] Le Owner ${campaign.ownerId} lance la campagne ${campaign.campaignId}`);
        
        if (campaign.rules.endTimeMs <= Date.now()) {
            logger.warn('Campagne expirée ignorée.');
            return;
        }

        // Pour chaque restaurant du patron
        for (const tenantId of campaign.targetTenantIds) {
            try {
                const isOwner = await SecurityGuard.verifyTenantOwnership(campaign.ownerId, tenantId);
                if (!isOwner) {
                    logger.error(`🚨 [YieldEngine] BREACH BLOQUÉ: Owner ${campaign.ownerId} rejeté sur tenant ${tenantId}`);
                    continue;
                }

                await this.applyStrategyToLocalTenant(tenantId, campaign);
            } catch (error) {
                logger.error(`Échec du déploiement Yield local sur ${tenantId}`, error);
            }
        }
    }

    /**
     * Applique la stratégie localement via l'API standard d'update de configuration.
     * PAS de MasterBridge ici. C'est une écriture client-side légitime.
     */
    private static async applyStrategyToLocalTenant(tenantId: string, campaign: YieldCampaign): Promise<void> {
        logger.info(`⚙️ [Yield Local] Application sur ${tenantId}...`);
        
        const yieldConfigPatch = {
            activeYieldCampaigns: {
                [campaign.campaignId]: {
                    modifierPercent: campaign.rules.priceModifierPercent,
                    categoryIdTarget: campaign.rules.categoryIdTarget,
                    productIdTarget: campaign.rules.productIdTarget,
                    expiresAt: campaign.rules.endTimeMs
                }
            }
        };

        // Mise à jour de la config via le système standard local du tenant
        // await LocalConfigService.update(tenantId, yieldConfigPatch);
        NexusEventBus.emit('commerce.yield_updated', { tenantId, config: yieldConfigPatch });
        
        logger.info(`✅ [Yield Local] Promo activée légitimement sur ${tenantId}.`);
    }

    /**
     * Autopilot : Le patron a activé le mode IA. L'IA lui suggère ou modifie ses prix.
     */
    public static async evaluateAutopilotTriggers(ownerId: string, allowedTenantIds: string[]): Promise<void> {
        // Le client interroge l'Oracle via son accès B2B
        const marketInsight = { isHeavyRainPredicted: true, affectedTenantIds: allowedTenantIds };
        
        if (marketInsight.isHeavyRainPredicted) {
            logger.info(`🌧️ [Yield] Alerte météo locale pour Owner ${ownerId} : Surge Pricing.`);
            const campaign: YieldCampaign = {
                campaignId: `SURGE_RAIN_${Date.now()}`,
                type: 'SURGE_PRICING',
                name: 'Storm Surge Optimization',
                ownerId,
                targetTenantIds: allowedTenantIds,
                rules: {
                    categoryIdTarget: 'delivery_fees',
                    priceModifierPercent: 15, 
                    startTimeMs: Date.now(),
                    endTimeMs: Date.now() + 2 * 60 * 60 * 1000
                },
                isAutopilot: true
            };
            
            await this.launchCampaign(campaign);
        }
    }
}
