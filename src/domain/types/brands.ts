/**
 * @file brands.ts
 * @description Définition des types opaques (Branded Types) pour l'Empire.
 */

// Utilitaire pour le Branding
export type Brand<K, T> = K & { __brand: T };

// Identifiant unique de restaurant (Tenant)
export type TenantID = Brand<string, "TenantID">;

// Métriques de santé système
export interface NodeHealth {
  memoryUsageMB: number;
  lowResActive: boolean;
  timestamp: number;
}

import { SovereignData } from '@/shared/nexus-contract';

// Structure de télémétrie pour le MCC
export interface SiteTelemetry {
  tenantId: TenantID;
  id?: string;
  key?: string;
  name?: string;
  status: 'ONLINE' | 'OFFLINE' | 'CRITICAL' | 'MAINTENANCE' | 'PROVISIONING' | 'LOCKED';
  tier?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'EMPIRE-LIMITLESS';
  createdAt?: string;
  healthScore: number;
  complianceScore?: number;
  lowStockAlerts?: number;
  lastSeen: string | number | { seconds: number; nanoseconds: number }; 
  activeOrders?: number;
  activeUsers?: number;
  dailyRevenue?: number;
  engineVersion: string;
  nodeHealth: NodeHealth;
  featureFlags?: SovereignData;
  branding?: SovereignData;
  security?: SovereignData;
}
