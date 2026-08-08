import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface FeatureFlagRule {
  flagKey: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 to 100
  allowedTenantIds?: string[];
  blockedTenantIds?: string[];
}

/**
 * 🚩 FeatureFlagService (Item 0.1)
 * Service de gestion et d'évaluation dynamique des feature flags par tenant pour le Cockpit MCC.
 * Supporte les rollouts progressifs par hachage déterministe de tenantId (`hash(tenantId) % 100 < percentage`).
 */
export class FeatureFlagService {
  /**
   * Calcule un hash déterministe entre 0 et 99 pour un tenantId
   */
  private static hashTenantId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      hash = (hash << 5) - hash + tenantId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Évalue si un flag est actif pour un tenant donné
   */
  static isFeatureEnabled(rule: FeatureFlagRule, tenantId: string): boolean {
    if (!rule.enabled) return false;

    // 1. Liste d'exclusion explicite
    if (rule.blockedTenantIds && rule.blockedTenantIds.includes(tenantId)) {
      return false;
    }

    // 2. Liste d'inclusion explicite (override)
    if (rule.allowedTenantIds && rule.allowedTenantIds.includes(tenantId)) {
      return true;
    }

    // 3. Rollout progressif en pourcentage
    const tenantHash = this.hashTenantId(tenantId);
    return tenantHash < rule.rolloutPercentage;
  }

  /**
   * Persiste la mise à jour d'un flag dans le MCC
   */
  static async toggleFeatureFlag(
    rule: FeatureFlagRule,
    operatorId: string
  ): Promise<void> {
    const path = `mcc/featureFlags/${rule.flagKey}`;
    await Nexus.adapter.set(path, {
      ...rule,
      updatedBy: operatorId,
      updatedAt: new Date().toISOString(),
    });

    empireAudit.log({
      module: 'system',
      action: 'MCC_FEATURE_FLAG_TOGGLED',
      details: { flagKey: rule.flagKey, enabled: rule.enabled, rolloutPercentage: rule.rolloutPercentage, operatorId },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(`[FeatureFlagService] Flag ${rule.flagKey} mis à jour par ${operatorId} (${rule.rolloutPercentage}% rollout)`);
  }
}
