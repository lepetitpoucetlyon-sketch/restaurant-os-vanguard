import { PageKey } from "./permissions.types";
import { SovereignData } from "@shared/nexus-contract";

/**
 * 🛡️ MaintenanceTicket - Restaurant OS
 * Structure de données pour le support Neural Shield.
 * Grade VI: Industrialized Security & Support.
 */
export interface MaintenanceTicket {
    id: string;
    tenantId: string;
    userId: string;
    type: 'CRITICAL_BUG' | 'UI_GLITCH' | 'DATA_INCONSISTENCY' | 'PERFORMANCE' | 'CONFIG_REQUEST';
    pageKey?: PageKey;
    description: string;
    screenshotUrl?: string;
    systemState: {
        currentRoute: string;
        orderCount: number;
        inventoryStatus: string;
        offlineMode: boolean;
        lastActions: string[];
        activeModules?: PageKey[];
    };
    logs: string[];
    status: 'pending' | 'analyzing' | 'pr_ready' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'critical';
    aiAnalysis?: MaintenanceAIAnalysis;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}

export interface MaintenanceAIAnalysis {
    summary: string;
    potentialCause: string;
    affectedFiles: string[];
    proposedFix?: string;
    prLink?: string;
    domainConfig?: SovereignData;
}

export interface MaintenanceTicketContext {
    route: string;
    domain: PageKey | 'Universal';
    logs: string[];
    tenant: string;
    activeModules?: PageKey[];
}
