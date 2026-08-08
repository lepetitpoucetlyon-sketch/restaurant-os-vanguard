/*
 * 🛰️ NEXUS SHARED GENOME - Universal SaaS Edition
 * Version Grade X - Sovereign Alignment
 */

export interface BusinessLaws {
  node_capacity: number;
  fiscal_coefficient: number;
  currency: string;
  pmsEnabled: boolean;
  [key: string]: string | number | boolean | undefined;
}

export type SovereignPrimitive = string | number | boolean | null | undefined;
export type SovereignField = SovereignPrimitive | SovereignMap | SovereignField[];
export type SovereignValue = SovereignField;
export interface SovereignMap {
  [key: string]: SovereignField;
}
export type SovereignData<T = SovereignMap> = T;

export interface SovereignSchemaField {
  id: string;
  type?: string;
  unit?: string;
  subFields?: SovereignSchemaField[];
  [key: string]: SovereignField;
}

export interface SovereignWriteSignature {
  scope: 'NF525_WRITE';
  version: 'NF525_WRITE_V1';
  tenantId: string;
  path: string;
  signedAt: string;
  payloadHash: string;
  signature: string;
}

export type SignedSovereignData = SovereignData & {
  __nf525?: SovereignWriteSignature;
};

export interface ExpertConfig {
  role: string;
  modelId: string;
  isConfigured: boolean;
  isAuthorized: boolean;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  borderRadius: string;
  appearance: 'light' | 'dark';
}

export interface OrchestratorSignal {
  maintenanceMode: boolean;
  killSwitch: boolean;
  licenceStatus: 'ACTIVE' | 'LOCKED' | 'TRIAL';
  layoutType: 'default' | 'kiosk' | 'hud' | 'admin' | 'sidebar' | 'topbar';
  updatedAt: string;
  economy: {
    basePrice: number;
    currency: string;
    billingStatus: string;
    discountMultiplier?: number;
  };
  businessLaws: BusinessLaws;
  expert?: ExpertConfig;
  // --- Grade X OTA & Fleet Extensions ---
  targetVersion?: string;
  otaUrl?: string;
  targetState?: 'stable' | 'beta' | 'bleeding-edge';
  priceMultiplier?: number;
  lastSignalId?: string; // Suture Grade X
}

export interface TelemetryPulse {
  version: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL';
  lastPulse: import('@/shared/nexus/contracts/infrastructure/storage.contracts').NexusTimestamp;
  health: {
    uptime: number;
    battery: {
      level: number;
      charging: boolean;
      supported: boolean;
    };
    network: {
      online: boolean;
      effectiveType: string;
    };
  };
  security: {
    nf525Sealed: boolean;
    integrityGrade: string;
    lastSealHash?: string;
  };
}

export interface TenantFirebaseConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  [key: string]: string | undefined;
}

export interface TenantConfig {
  id: string;
  name?: string; 
  tier?: string; 
  billing?: {
    status: string;
    plan: string;
    nextBillingDate?: string;
  };
  marketplace?: {
    enabledModules: string[];
    [key: string]: string[] | undefined;
  };
  ai?: {
    enabled: boolean;
    model?: string;
    quota?: number;
    llmApiKey?: string;
  };
  branding?: TenantTheme;
  capabilities?: Record<string, boolean>;
  features?: Record<string, boolean>; 
  theme?: TenantTheme;
  status?: OrchestratorSignal;
  metadata?: {
    name: string;
    version: string;
    description?: string;
    ownerId?: string;
    createdAt?: string;
    subscriptionTier?: string;
  };
  customFeatures?: Record<string, boolean>;
  firebase?: TenantFirebaseConfig;
}

/**
 * 🏛️ SovereignNode - Universal Entity Contract
 * unknown business object MUST implement this to be handled by the Core.
 */
export interface SovereignNode {
  id: string;
  updatedAt: string;
  createdAt?: string;
  [key: string]: SovereignField;
}

/**
 * 🏛️ OperationalIdentity - Abstract Identifiers
 */
export enum OperationalIdentity {
  NODES = 'STX_ALPHA',
  ALLOCATIONS = 'STX_BETA',
  FLOWS = 'STX_GAMMA',
  RESOURCES = 'STX_DELTA',
  PROTOCOLS = 'STX_EPSILON',
  COMPLIANCE = 'STX_ZETA',
  RELATIONS = 'STX_ETA',
  STRUCTURES = 'STX_THETA',
  ZONES = 'STX_IOTA',
  STAFF = 'STX_KAPPA',
  LEDGER = 'STX_LAMBDA'
}



export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, 'id'> = {
  capabilities: {},
  theme: {
    primaryColor: '#0F172A',
    secondaryColor: '#38BDF8',
    logoUrl: '',
    borderRadius: '12px',
    appearance: 'dark'
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    layoutType: 'default',
    licenceStatus: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    economy: {
      basePrice: 49.00,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
      discountMultiplier: 1
    },
    businessLaws: {
      node_capacity: 0,
      fiscal_coefficient: 0.1,
      currency: 'EUR',
      pmsEnabled: false
    },
    expert: {
      role: 'disabled',
      modelId: 'none',
      isConfigured: false,
      isAuthorized: false
    }
  },
  metadata: {
    name: 'Nexus Node',
    version: '1.0.0'
  }
};
