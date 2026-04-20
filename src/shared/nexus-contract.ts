/**
 * 🛰️ NEXUS SHARED GENOME - Universal SaaS Edition
 * Version Grade X - Sovereign Alignment
 */

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
  businessLaws: Record<string, unknown>;
  expert?: Record<string, unknown>;
}

export interface TenantConfig {
  id: string;
  capabilities: Record<string, boolean>;
  theme: TenantTheme;
  status: OrchestratorSignal;
  metadata: {
    name: string;
    version: string;
    ownerId?: string;
    [key: string]: unknown;
  };
  customFeatures?: Record<string, boolean>;
  firebase?: {
    apiKey: string;
    projectId: string;
    appId: string;
    [key: string]: string;
  };
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
