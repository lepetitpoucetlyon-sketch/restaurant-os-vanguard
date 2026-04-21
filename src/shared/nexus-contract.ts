/**
 * 🛰️ NEXUS SHARED GENOME - Universal SaaS Edition
 * Version Grade X - Sovereign Alignment
 */

export interface BusinessLaws {
  table_count: number;
  tax_rate: number;
  currency: string;
  pmsEnabled: boolean;
  [key: string]: string | number | boolean | undefined;
}

export type SovereignValue = string | number | boolean | null | undefined | Date;
export type SovereignData = { [key: string]: SovereignValue | SovereignData | SovereignData[] };

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
  licenceStatus: 'active' | 'locked' | 'trial';
  layoutType: 'default' | 'kiosk' | 'hud' | 'admin' | 'sidebar' | 'topbar';
  updatedAt: string;
  economy: {
    basePrice: number;
    currency: string;
    billingStatus: string;
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
  status: 'active' | 'maintenance' | 'critical';
  lastPulse: string | number | { seconds: number; nanoseconds: number }; 
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
    geminiApiKey?: string;
  };
  branding?: TenantTheme;
  capabilities?: Record<string, boolean>;
  features?: Record<string, boolean>; 
  theme?: TenantTheme;
  status?: OrchestratorSignal;
  metadata?: {
    name: string;
    version: string;
    ownerId?: string;
    createdAt?: string;
    subscriptionTier?: string;
  };
  customFeatures?: Record<string, boolean>;
  firebase?: TenantFirebaseConfig;
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
    licenceStatus: 'active',
    updatedAt: new Date().toISOString(),
    economy: {
      basePrice: 49.00,
      billingStatus: 'active',
      currency: 'EUR'
    },
    businessLaws: {},
    expert: {}
  },
  metadata: {
    name: 'Nexus Node',
    version: '1.0.0'
  }
};
