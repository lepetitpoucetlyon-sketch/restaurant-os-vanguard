/**
 * 🏛️ NEXUS SHARED KERNEL - Sovereign Base
 * Version Grade X - Sovereign Alignment
 */

export interface SovereignNode {
  id: string;
  updatedAt: string;
  createdAt: string;
  [key: string]: SovereignField;
}

export type SovereignPrimitive = string | number | boolean | null | undefined;
export type SovereignField = string | number | boolean | null | undefined | { [key: string]: any } | any[];
export type SovereignValue = SovereignField;
export interface SovereignMap {
  [key: string]: SovereignField;
}

export type SovereignData = SovereignMap;

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning' | 'locked';

export interface TenantTheme {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  mode: 'light' | 'dark' | 'auto';
  glassmorphism?: number;
  borderRadius?: number;
}

export interface TenantFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface BusinessHours {
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface BusinessSchedule {
  [key: string]: BusinessHours; // monday, tuesday...
}

export interface BusinessLaws {
  country: 'FR' | 'UK' | 'US' | 'ES' | 'IT' | 'DE';
  vatRates: number[];
  currency: 'EUR' | 'GBP' | 'USD';
  nf525Required: boolean;
  haccpRequired: boolean;
  alcoholLicenceRequired: boolean;
}

export interface OrchestratorSignal {
  lastPulse: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'CRITICAL';
  targetVersion: string;
  priceMultiplier?: number;
}

export interface ExpertConfig {
  aiEnabled: boolean;
  autonomousOrdering?: boolean;
  predictiveStaffing?: boolean;
  dynamicPricing?: boolean;
  voiceControl?: boolean;
}

export interface TenantConfig extends SovereignNode {
  id: string;
  key: string;
  name: string;
  alias?: string;
  description?: string;
  domain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  mode?: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  currency: string;
  laws: BusinessLaws;
  schedule: BusinessSchedule;
  expert: ExpertConfig;
  features?: Record<string, boolean>;
  theme?: TenantTheme;
  status?: OrchestratorSignal;
  customFeatures?: Record<string, boolean>;
  firebase?: TenantFirebaseConfig;
  metadata?: SovereignData;
  createdAt: string;
  updatedAt: string;
}
