import type { PlatformVariant } from '@/modules/system';
import type { TenantConfig } from '@/shared/nexus-contract';
import type {
  IConnectorManifest,
  ConnectorPerm,
  ConnectorUserContext,
  ConnectorWithState,
  ConnectorState,
} from '@/shared/connector-manifest/types';
import { CONNECTOR_CATALOG } from '@/shared/connector-manifest/catalog';
import { CONNECTOR_PERM_LEVELS } from '@/shared/connector-manifest/types';
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
    const manifest = CONNECTOR_CATALOG[id];
    if (!manifest) return false;

    const variant = tenant.variant ?? 'restaurant';
    const supportsVertical =
      manifest.verticals === 'all' || manifest.verticals.includes(variant as PlatformVariant);

    const hasCapability =
      !manifest.requiredCapability ||
      tenant.capabilities == null ||   // pas de config = tout accordé
      (tenant.capabilities[manifest.requiredCapability] === true);

    return supportsVertical && hasCapability;
  }

  /**
   * Connecteurs disponibles pour le tenant, enrichis de leur état Nexus.
   * `states` vient d'un fetch `tenants/{tenantId}/connectors/*` fait côté appelant.
   */
  static forTenant(
    tenant: TenantConfig,
    states: Record<string, ConnectorState>,
  ): ConnectorWithState[] {
    return ConnectorHub.listForVertical((tenant.variant ?? 'restaurant') as PlatformVariant)
      .filter(m => ConnectorHub.isAvailableForTenant(m.id, tenant))
      .map(m => ({ manifest: m, state: states[m.id] ?? null }));
  }

  /** Connecteurs actifs (status='active') pour le tenant */
  static activeFor(
    tenant: TenantConfig,
    states: Record<string, ConnectorState>,
  ): ConnectorWithState[] {
    return ConnectorHub.forTenant(tenant, states).filter(
      c => c.state?.status === 'active',
    );
  }

  // ─── RBAC ─────────────────────────────────────────────────────────────────

  /**
   * Vérifie si un utilisateur a la permission sur un connecteur.
   *
   * Ordre de priorité :
   *   1. Surcharge explicite dans `user.connectorOverrides[connectorId]`
   *   2. Niveau de rôle PERMISSION_ROLE_LEVELS vs CONNECTOR_PERM_LEVELS
   */
  static canUserAccess(
    connectorId: string,
    user: ConnectorUserContext,
    perm: ConnectorPerm,
  ): boolean {
    // Surcharge explicite par connecteur (admin peut restreindre un manager par ex.)
    const override = user.connectorOverrides?.[connectorId];
    if (override !== undefined) {
      return override.includes(perm);
    }

    const userLevel = PERMISSION_ROLE_LEVELS[user.role] ?? 0;
    const requiredLevel = CONNECTOR_PERM_LEVELS[perm];
    return userLevel >= requiredLevel;
  }

  /**
   * Retourne les permissions effectives d'un utilisateur sur un connecteur.
   */
  static permissionsFor(
    connectorId: string,
    user: ConnectorUserContext,
  ): ConnectorPerm[] {
    const all: ConnectorPerm[] = ['configure', 'manage', 'use'];
    return all.filter(p => ConnectorHub.canUserAccess(connectorId, user, p));
  }

  // ─── Helpers catégorie ────────────────────────────────────────────────────

  static byCategory(
    connectors: IConnectorManifest[],
  ): Record<string, IConnectorManifest[]> {
    return connectors.reduce<Record<string, IConnectorManifest[]>>((acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {});
  }

  static byPillar(
    connectors: IConnectorManifest[],
  ): Record<string, IConnectorManifest[]> {
    return connectors.reduce<Record<string, IConnectorManifest[]>>((acc, m) => {
      if (!acc[m.pillar]) acc[m.pillar] = [];
      acc[m.pillar].push(m);
      return acc;
    }, {});
  }
}
