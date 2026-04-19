/**
 * 🛰️ NEXUS SHARED GENOME - Universal SaaS Edition
 * Technical contract for Suzerain-Vassal real-time communication.
 * Grade VIII - Sovereign Purity.
 */

/**
 * SystemCapabilities
 * Agnostic map of enabled modules or features.
 * Key: Capability ID (e.g., 'pos_v1', 'drone_nav_v2')
 * Value: Availability status
 */
export type SystemCapabilities = Record<string, boolean>;

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  borderRadius: string;
  appearance: 'light' | 'dark';
  typography?: string;
}

export interface EmpireEconomyPolicy {
  basePrice: number;
  discountMultiplier: number;
  billingStatus: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'trial';
  currency: string;
}

export interface OrchestratorSignal {
  maintenanceMode: boolean;
  killSwitch: boolean;
  active?: boolean;
  licenceStatus: 'active' | 'locked' | 'trial';
  targetVersion?: string;
  otaUrl?: string;
  layoutType: 'default' | 'kiosk' | 'hud' | 'admin' | 'sidebar';
  lastSignalId?: string;
  updatedAt: string;
  
  economy: EmpireEconomyPolicy;

  /**
   * Business Metadata (Grade VIII - Dynamic Injection)
   * Any business-specific laws (price multipliers, etc.) are injected here.
   */
  businessLaws: Record<string, any>;
}

/**
 * 🧬 TenantConfig
 * Source of truth for the connection between MCC and local instance.
 */
export interface TenantConfig {
  id: string;
  capabilities: SystemCapabilities;
  theme: TenantTheme;
  status: OrchestratorSignal;
  telemetry?: TelemetryPulse;
  metadata: {
    name: string;
    version: string;
    ownerId?: string;
    createdAt?: string;
  };
}

/**
 * 📊 TelemetryPulse
 * Data package sent from the Vassal (OS) to the Suzerain (MCC).
 */
export interface TelemetryPulse {
  version: string;
  status: 'active' | 'error' | 'maintenance';
  lastPulse: string | number | Date;
  health: {
    uptime: number;
    battery: {
      level: number;
      charging: boolean;
      supported: boolean;
    };
    network: {
      online: boolean;
      effectiveType?: string;
    };
  };
  security: {
    nf525Sealed: boolean;
    lastSealHash?: string;
    integrityGrade: string;
  };
}

/**
 * Default Safety Configuration (Agnostic - Full Access)
 * Guards against the "Black Screen" effect if sync fails.
 */
export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, 'id'> = {
  capabilities: {}, // Start empty (pure shell)
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
      discountMultiplier: 1.0,
      billingStatus: 'active',
      currency: 'EUR'
    },
    businessLaws: {}
  },
  metadata: {
    name: 'Nexus Node',
    version: '1.0.0'
  }
};
