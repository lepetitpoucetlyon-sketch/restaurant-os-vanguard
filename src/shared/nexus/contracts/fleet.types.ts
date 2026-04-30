/**
 * 🛰️ FLEET & EMPIRE DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 */

import { SovereignNode, SovereignField } from '@shared/nexus-contract';

export interface EmpireInstance extends SovereignNode {
    id: string;
    key: string;
    name: string;
    status: 'PROVISIONING' | 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'LOCKED' | 'CRITICAL';
    tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'EMPIRE-LIMITLESS';
    version: string;
    createdAt: string;
    lastHeartbeat: string;
    metrics: {
        activeUsers: number;
        dailyRevenue: number;
        revenue24h: number;
        healthScore: number;
        complianceScore: number;
        [key: string]: SovereignField;
    };
    branding: {
        primaryColor: string;
        secondaryColor?: string;
        logoUrl?: string;
        tagline?: string;
    };
    security: {
        twoFactorEnabled: boolean;
        nf525Certified: boolean;
        [key: string]: SovereignField;
    };
}

export interface EmpireGlobalMetrics {
    totalInstances: number;
    activeFleetCount: number;
    fleetTotalRevenue: number;
    averageHealthScore: number;
    averageComplianceScore: number;
    totalActiveUsers: number;
    criticalAlerts: number;
    totalRisks: number;
    totalMRR: number;
    totalLaborCost: number;
    averageFoodCost: number;
}

export interface FleetInsight {
    id: string;
    type: 'anomaly' | 'opportunity' | 'strategic_move';
    title: string;
    description: string;
    message?: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: string;
    recommendation?: string;
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
    status:  'CRITICAL' | 'PROVISIONING' | 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'LOCKED';
    tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'EMPIRE-LIMITLESS';
    version: string;
    createdAt: string;
    lastHeartbeat: string;
    activeUsers: number;
    complianceScore: number;
    healthScore: number;
    lowStockAlerts: number;
    branding: SiteBranding;
    security: SiteSecurity;
}
