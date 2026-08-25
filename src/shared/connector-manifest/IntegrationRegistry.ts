import { CONNECTOR_CATALOG } from './catalog';
import type { IConnectorManifest, ConnectorCategory } from './types';

export interface OperationalIntegration {
  id: string;
  displayName: string;
  category: ConnectorCategory;
  pillar: 'ops' | 'commerce' | 'finance' | 'human' | 'logistics' | 'compliance' | 'intelligence';
  isImplemented: boolean;
  comingSoon: boolean;
  manifest: IConnectorManifest;
  authType: string;
}

/**
 * 🔌 IntegrationRegistry (Priorité 2.2)
 * Registre unifié des intégrations tierces et connecteurs de l'écosystème Restaurant OS.
 * (Nommé `IntegrationRegistry` pour éviter toute collision avec le `ConnectorRegistry` de migration de données).
 */
export class IntegrationRegistry {
  private static manifests: Map<string, IConnectorManifest> = new Map();

  static {
    for (const [id, manifest] of Object.entries(CONNECTOR_CATALOG)) {
      this.manifests.set(id, manifest);
    }
  }

  static get(id: string): IConnectorManifest | undefined {
    return this.manifests.get(id);
  }

  static getAll(): IConnectorManifest[] {
    return Array.from(this.manifests.values());
  }

  static getOperationalIntegrations(): OperationalIntegration[] {
    return this.getAll().map(manifest => ({
      id: manifest.id,
      displayName: manifest.displayName,
      category: manifest.category,
      pillar: manifest.pillar,
      isImplemented: !manifest.comingSoon,
      comingSoon: manifest.comingSoon === true,
      manifest,
      authType: manifest.authType,
    }));
  }

  static getImplemented(): IConnectorManifest[] {
    return this.getAll().filter(m => !m.comingSoon);
  }

  static getComingSoon(): IConnectorManifest[] {
    return this.getAll().filter(m => m.comingSoon === true);
  }

  static getByPillar(pillar: IConnectorManifest['pillar']): IConnectorManifest[] {
    return this.getAll().filter(m => m.pillar === pillar);
  }

  static getByCategory(category: ConnectorCategory): IConnectorManifest[] {
    return this.getAll().filter(m => m.category === category);
  }

  static isAvailableForVariant(connectorId: string, variant: string): boolean {
    const manifest = this.get(connectorId);
    if (!manifest) return false;
    if (manifest.verticals === 'all') return true;
    return manifest.verticals.includes(variant as never);
  }
}
