/**
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

export type SovereignField =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | unknown[]
  | { [key: string]: unknown }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'date'; value: Date | string }
  | { type: 'object'; value: Record<string, unknown> }
  | { type: 'array'; value: unknown[] };

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

export interface SovereignWriteSignature extends SovereignMap {
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

// TenantTheme is now imported from schemas


export interface TelemetryPulse {
  version: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL';
  lastPulse: import('@nexus/contracts/infrastructure/storage.contracts').NexusTimestamp;
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

import type { TenantConfig, OrchestratorSignal, TenantTheme } from '@nexus/contracts';
export type { TenantConfig, OrchestratorSignal, TenantTheme };

/**
 * 🏛️ SovereignNode - Universal Entity Contract
 * unknown business object MUST implement this to be handled by the Core.
 */
export interface SovereignNode {
  id: string;
  updatedAt: string | Date | number;
  createdAt?: string | Date | number;
  [key: string]: SovereignField;
}

/**
 * 🏛️ OperationalIdentity - Abstract Identifiers
 */
export enum OperationalIdentity {
  CORE = 'STX_CORE',
  FINANCE = 'STX_FINANCE',
  OPS = 'STX_OPS',
  HR = 'STX_HR',
  CRM = 'STX_CRM',
  LOGISTICS = 'STX_LOGISTICS',
  INTELLIGENCE = 'STX_INTELLIGENCE',
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
  variant: 'restaurant',
  capabilities: {},
  features: {
    pos: true,
    kds: true,
    inventory: true,
    hr: true,
    reservations: true,
    finance: true,
    marketing: true
  },
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
