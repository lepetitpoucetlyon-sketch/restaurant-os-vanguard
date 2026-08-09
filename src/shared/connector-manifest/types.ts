import type { PlatformVariant } from '@/modules/system';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';

export type ConnectorCategory =
  | 'reservations'
  | 'delivery'
  | 'reviews'
  | 'emailing'
  | 'accounting'
  | 'invoices'
  | 'payments'
  | 'banking'
  | 'payroll'
  | 'timeclock'
  | 'recruitment'
  | 'suppliers'
  | 'marketplace'
  | 'ecommerce'
  | 'iot'
  | 'weather'
  | 'events'
  | 'ai-llm'
  | 'ai-legal'
  | 'ai-search'
  | 'communication'
  | 'calendar'
  | 'storage'
  | 'vertical-specific';

export type ConnectorAuthType = 'api_key' | 'oauth2' | 'webhook_inbound' | 'none';

export type ConnectorPerm = 'configure' | 'manage' | 'use';

// Niveau de rôle minimum requis par permission (référence PERMISSION_ROLE_LEVELS)
export const CONNECTOR_PERM_LEVELS: Record<ConnectorPerm, number> = {
  configure: 90,  // directeur+
  manage:    70,  // manager+
  use:        0,  // tous
};

export interface ConnectorFieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  optional?: boolean;
}

export interface IConnectorManifest {
  id: string;
  displayName: string;
  logo: string;              // emoji ou chemin /icons/…
  category: ConnectorCategory;
  pillar: 'ops' | 'commerce' | 'finance' | 'human' | 'logistics' | 'compliance' | 'intelligence';

  authType: ConnectorAuthType;

  // Quels verticals peuvent activer ce connecteur
  verticals: PlatformVariant[] | 'all';
  // Activé automatiquement à la création du tenant (sans config manuelle)
  autoActivateFor: PlatformVariant[];

  // Capability mod_* dans les seeds qui doit être true pour que le connecteur soit disponible
  requiredCapability: string;

  isPremium: boolean;

  // Champs de config pour authType='api_key'
  fields?: ConnectorFieldDef[];

  // OAuth2
  oauthConfig?: {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    callbackRoute: string;
  };

  // MCP server (connecteurs intelligence)
  mcp?: {
    serverUrl: string;
    toolNames: string[];
  };
}

// Ce qui est stocké dans Nexus : tenants/{tenantId}/connectors/{connectorId}
export interface ConnectorState {
  status: 'pending_config' | 'active' | 'error' | 'disabled';
  activatedAt: number;
  activatedBy: 'system' | string;  // 'system' = auto-activation, sinon userId
  /** Blob AES-256-GCM : "<iv>:<tag>:<ciphertext>" — jamais exposé au client */
  credentials?: string;
  lastSyncAt?: number;
  errorMessage?: string;
}

export interface ConnectorWithState {
  manifest: IConnectorManifest;
  state: ConnectorState | null;
}

// Profil minimal utilisateur pour les checks RBAC connecteur
export interface ConnectorUserContext {
  role: PermissionRole;
  connectorOverrides?: Partial<Record<string, ConnectorPerm[]>>;  // surcharges par connecteur
}
