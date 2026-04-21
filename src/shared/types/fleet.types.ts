/**
 * 🛰️ FLEET & EMPIRE DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 */

import { EmpireInstance } from '@/domain/types/empire';

export interface FleetInsight {
    id: string;
    type: 'anomaly' | 'opportunity' | 'strategic_move';
    title: string;
    description: string;
    message?: string; // Suture Alias for UI
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: string;
    recommendation?: string; // Suture Alias for UI
    affectedInstances: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    potentialRoI: number;
    canAutoExecute: boolean;
}

export interface ConsolidatedMetrics {
    totalRevenue: number;
    activeUsers: number;
    averageHealth: number;
    totalAlerts: number;
    totalLaborCost: number;
    averageFoodCost: number;
    collectiveArbitrageSavings: number;
    volatilityIndex: number;
}

export interface QuantumMetrics {
    globalROI: number;
    fleetEntropy: number;
    arbitrageOpportunities: number;
    otaStagingCount: number;
}

export interface SiteBranding {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    tagline?: string;
}

export interface SiteSecurity {
    twoFactorEnabled: boolean;
    nf525Certified: boolean;
    maintenanceAccessGranted: boolean;
    maintenanceGrantedUntil?: string;
    supportAccessGranted: boolean;
    supportAccessUntil?: string;
}

export interface SiteTelemetry {
    id: string;
    key: string;
    name: string;
    status:  'error' | 'provisioning' | 'online' | 'offline' | 'maintenance' | 'locked';
    tier: 'standard' | 'premium' | 'enterprise' | 'empire-limitless';
    version: string;
    createdAt: string;
    lastHeartbeat: string;
    activeUsers: number;
    complianceScore: number;
    lowStockAlerts: number;
    branding: SiteBranding;
    security: SiteSecurity;
}
