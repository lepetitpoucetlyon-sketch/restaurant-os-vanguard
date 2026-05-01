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

import { SovereignData } from '@shared/nexus-contract';

import { SiteTelemetry } from '@nexus/contracts';
export type { SiteTelemetry };
