import type { PlatformVariant } from '@/modules/system';
import type { TenantConfig } from "@/shared/nexus/contracts";
import type {
  IConnectorManifest,
  ConnectorPerm,
  ConnectorUserContext,
  ConnectorWithState,
  ConnectorState,
} from './types';
import { CONNECTOR_CATALOG } from './catalog';
import { CONNECTOR_PERM_LEVELS } from './types';
import { PERMISSION_ROLE_LEVELS } from '@/shared/nexus/contracts/permissions.types';

export class ConnectorHub {

  // ─── Lecture catalogue ────────────────────────────────────────────────────

  static getManifest(id: string): IConnectorManifest {
    const manifest = CONNECTOR_CATALOG[id];
    if (!manifest) throw new Error(`[ConnectorHub] Connecteur inconnu : "${id}"`);
    return manifest;
  }

  static list(): IConnectorManifest[] {
    return Object.values(CONNECTOR_CATALOG);
  }

  /** Connecteurs disponibles pour un vertical donné */
  static listForVertical(variant: PlatformVariant): IConnectorManifest[] {
    return Object.values(CONNECTOR_CATALOG).filter(m =>
      m.verticals === 'all' || m.verticals.includes(variant)
    );
  }

  /** IDs des connecteurs à activer automatiquement à la création d'un tenant */
  static getAutoActivated(variant: PlatformVariant): string[] {
    return Object.values(CONNECTOR_CATALOG)
      .filter(m => m.autoActivateFor.includes(variant))
      .map(m => m.id);
  }

  // ─── Checks tenant ────────────────────────────────────────────────────────

  /**
   * Vérifie si le connecteur est disponible pour ce tenant.
   * Deux conditions :
   *   1. Le vertical du tenant supporte le connecteur
   *   2. La capability requise est activée dans la config tenant
   */
  static isAvailableForTenant(id: string, tenant: TenantConfig): boolean {
    const manifest = ConnectorHub.getManifest(id);
    const variant = (tenant.variant ?? 'restaurant') as PlatformVariant;

    // Check vertical
    if (manifest.verticals !== 'all' && !manifest.verticals.includes(variant)) {
      return false;
    }

    // Check capability
    if (manifest.requiredCapability) {
      const caps = (tenant.capabilities ?? []) as string[];
      if (!caps.includes(manifest.requiredCapability)) {
        return false;
      }
    }

    return true;
  }

  /** Liste les connecteurs disponibles pour un tenant donné */
  static forTenant(
    tenant: TenantConfig,
    states: Record<string, ConnectorState> = {},
  ): ConnectorWithState[] {
    return ConnectorHub.listForVertical((tenant.variant ?? 'restaurant') as PlatformVariant)
      .filter(m => ConnectorHub.isAvailableForTenant(m.id, tenant))
      .map(manifest => ({
        manifest,
        state: states[manifest.id] ?? null,
      }));
  }

  /** Liste uniquement les connecteurs ACTIFS pour un tenant */
  static activeForTenant(
    tenant: TenantConfig,
    states: Record<string, ConnectorState> = {},
  ): ConnectorWithState[] {
    return ConnectorHub.forTenant(tenant, states).filter(
      c => c.state?.status === 'active'
    );
  }

  // ─── Checks RBAC ──────────────────────────────────────────────────────────

  /**
   * Vérifie si un utilisateur a le droit d'effectuer une action sur un connecteur.
   *
   * @param connectorId  ID du connecteur
   * @param user         Contexte utilisateur (role, permissions explicites)
   * @param perm         Action demandée : 'view' | 'use' | 'configure' | 'manage'
   */
  static canUserAccess(
    _connectorId: string,
    user: ConnectorUserContext,
    perm: ConnectorPerm,
  ): boolean {
    const userLevel = PERMISSION_ROLE_LEVELS[user.role] ?? 0;
    const requiredLevel = CONNECTOR_PERM_LEVELS[perm] ?? 99;

    return userLevel >= requiredLevel;
  }

  /** Retourne les permissions effectives d'un utilisateur sur un connecteur */
  static userPermissions(
    connectorId: string,
    user: ConnectorUserContext,
  ): ConnectorPerm[] {
    const all: ConnectorPerm[] = ['use', 'manage', 'configure'];
    return all.filter(p => ConnectorHub.canUserAccess(connectorId, user, p));
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  /** Groupement par catégorie */
  static byCategory(manifests: IConnectorManifest[]): Record<string, IConnectorManifest[]> {
    return manifests.reduce<Record<string, IConnectorManifest[]>>((acc, m) => {
      acc[m.category] = acc[m.category] ?? [];
      acc[m.category].push(m);
      return acc;
    }, {});
  }
}
