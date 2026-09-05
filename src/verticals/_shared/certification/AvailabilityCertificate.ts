import type { PrecisionTier } from '../blueprint/VerticalBlueprint';
import { getVerticalBlueprint } from '../catalog/VerticalBlueprintRegistry';
import { validateBlueprint, resolveBlueprintCapabilities } from '../blueprint';
import { resolveCapabilityDependencies } from '../catalog/CapabilityCatalog';
import { routesForCapabilities } from '../catalog/CapabilityWiring';
import { VerticalRegistry } from '@/shared/plugins/VerticalRegistry';

export interface AvailabilityCertificate {
  variant: string;
  tier: PrecisionTier;
  certified: boolean;
  certifiedAt: string;
  capabilities: string[];
  routesCount: number;
  rolesCount: number;
  hardwareRequirements: string[];
  errors: string[];
}

/**
 * 📜 AvailabilityCertificateService (Phase 3 Audit Remediation)
 *
 * Moteur de certification formelle garantissant qu'aucune verticale incomplète
 * ou fictive ne peut être mise en service ou provisionnée par la MCC.
 */
export class AvailabilityCertificateService {
  /**
   * Évalue la disponibilité réelle d'une verticale et émet un certificat opposable.
   */
  static async validateAvailability(
    variant: string,
    minTier: PrecisionTier = 'L2',
  ): Promise<AvailabilityCertificate> {
    const errors: string[] = [];
    const now = new Date().toISOString();

    const bp = getVerticalBlueprint(variant);
    if (!bp) {
      return {
        variant,
        tier: 'L0',
        certified: false,
        certifiedAt: now,
        capabilities: [],
        routesCount: 0,
        rolesCount: 0,
        hardwareRequirements: [],
        errors: [`Aucun blueprint enregistré pour la verticale "${variant}".`],
      };
    }

    // 0. Attente de la résolution du registre des plugins
    await VerticalRegistry.ready?.();

    // 1. Validation de structure Zod
    const structureErrors = validateBlueprint(bp);
    if (structureErrors.length > 0) {
      errors.push(...structureErrors.map((e) => `Structure blueprint invalide: ${e}`));
    }

    // 2. Vérification du tier de précision
    const tierOrder: Record<PrecisionTier, number> = { L0: 0, L1: 1, L2: 2, L3: 3 };
    if (tierOrder[bp.precision] < tierOrder[minTier]) {
      errors.push(
        `Niveau de précision insuffisant: ${bp.precision} < ${minTier} requis pour la certification commerciale.`,
      );
    }

    // 3. Résolution des capacités et dépendances transitives
    const caps = resolveBlueprintCapabilities(bp);
    const activeCaps = Object.keys(caps).filter((k) => (caps as Record<string, boolean>)[k]) as any[];
    const resolvedDeps = resolveCapabilityDependencies(activeCaps);
    const missingDeps = resolvedDeps.filter((k) => !activeCaps.includes(k));
    if (missingDeps.length > 0) {
      errors.push(...missingDeps.map((m) => `Dépendance manquante non activée: ${m}`));
    }

    // 4. Routes atteignables
    const routes = routesForCapabilities(activeCaps as any);
    if (routes.length === 0 && bp.routes.length === 0) {
      errors.push('Aucune route atteignable déclarée pour cette verticale.');
    }

    // 5. Rôles déclarés
    const rolesCount = Object.keys(bp.roleMap ?? {}).length;
    if (rolesCount === 0) {
      errors.push('Aucun mapping de rôle métier (roleMap) déclaré dans le blueprint.');
    }

    // 6. Enregistrement dans VerticalRegistry
    const isPluginRegistered = VerticalRegistry.has(variant as any);
    if (!isPluginRegistered) {
      errors.push(`Le plugin runtime pour "${variant}" n'est pas enregistré dans VerticalRegistry.`);
    }

    const certified = errors.length === 0;

    return {
      variant,
      tier: bp.precision,
      certified,
      certifiedAt: now,
      capabilities: activeCaps,
      routesCount: routes.length + bp.routes.length,
      rolesCount,
      hardwareRequirements: (bp.hardware ?? []) as string[],
      errors,
    };
  }

  /**
   * Contrôle bloquant pour la MCC avant d'engager le provisioning d'un tenant.
   */
  static async assertProvisioningAllowed(variant: string): Promise<void> {
    const cert = await this.validateAvailability(variant, 'L2');
    if (!cert.certified) {
      throw new Error(
        `[MCC/Availability] Provisioning interdit pour la verticale "${variant}": ` +
          cert.errors.join(' | '),
      );
    }
  }
}
