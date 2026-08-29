import type { TenantConfig } from '@/modules/system/domain/schemas/tenant';

export interface BusinessLaws {
  node_capacity: number;
  fiscal_coefficient: number;
  currency: string;
  pmsEnabled: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface ExpertConfig {
  role: string;
  modelId: string;
  isConfigured: boolean;
  isAuthorized: boolean;
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
