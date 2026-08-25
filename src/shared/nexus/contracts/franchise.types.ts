/**
 * 🏢 FRANCHISE & MULTI-SITES DOMAIN CONTRACTS
 * Version Grade X - Sovereign Alignment
 * Conçu pour les propriétaires et gérants de groupes multi-restaurants (Espace Restaurant).
 */

import { SovereignNode, SovereignField } from '@/shared/nexus-contract';

export interface FranchiseGroup extends SovereignNode {
    id: string;
    name: string;
    ownerId: string;
    currency: string;
    siteIds: string[];
    createdAt: string;
    updatedAt: string;
    settings?: {
        allowInterSiteTransfers?: boolean;
        autoApproveTransfers?: boolean;
        centralizedCatalog?: boolean;
    };
}

export interface FranchiseSiteOverview {
    tenantId: string;
    name: string;
    address?: string;
    city?: string;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'CLOSED';
    /** @deprecated miroir legacy — utiliser todayRevenueInMicrounits */
    todayRevenueInCents: number;
    todayRevenueInMicrounits?: number;
    openOrdersCount: number;
    coversServedCount: number;
    /** @deprecated miroir legacy — utiliser averageTicketInMicrounits */
    averageTicketInCents: number;
    averageTicketInMicrounits?: number;
    activeStaffCount: number;
    stockAlertsCount: number;
    healthScore: number;
    complianceScore: number;
    lastActivity: string;
}

export interface FranchiseConsolidatedMetrics {
    totalSites: number;
    onlineSites: number;
    /** @deprecated miroir legacy — utiliser totalTodayRevenueInMicrounits */
    totalTodayRevenueInCents: number;
    totalTodayRevenueInMicrounits?: number;
    totalOpenOrders: number;
    totalCoversServed: number;
    /** @deprecated miroir legacy — utiliser averageTicketInMicrounits */
    averageTicketInCents: number;
    averageTicketInMicrounits?: number;
    totalStockAlerts: number;
    topPerformingSite?: {
        tenantId: string;
        name: string;
        /** @deprecated miroir legacy — utiliser revenueInMicrounits */
        revenueInCents: number;
        revenueInMicrounits?: number;
    };
}

export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';

export interface TransferItem {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
}

export interface InterSiteTransfer extends SovereignNode {
    id: string;
    groupId: string;
    sourceTenantId: string;
    sourceTenantName: string;
    targetTenantId: string;
    targetTenantName: string;
    requestedBy: string;
    requestedAt: string;
    status: TransferStatus;
    items: TransferItem[];
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    receivedBy?: string;
    receivedAt?: string;
    [key: string]: SovereignField;
}

export interface CatalogSyncPayload {
    sourceTenantId: string;
    targetTenantIds: string[];
    syncCategories: boolean;
    syncProducts: boolean;
    syncRecipes: boolean;
}
