import type { PlatformVariant } from '@nexus/contracts';

export interface ProvisioningRequest {
    ownerEmail: string;
    ownerName: string;
    companyName: string;
    siret: string;
    planId: 'STANDARD' | 'PREMIUM';
    variant?: PlatformVariant;
    branding: {
        primaryColor: string;
        logoUrl?: string;
    };
    adminPin?: string;
}

export interface ProvisioningResult {
    tenantId: string;
    ownerId: string;
    stripeCustomerId: string;
    ragWorkspaceId: string;
    status: 'SUCCESS' | 'FAILED';
    adminEmail?: string;
    adminPin?: string;
    createdAt?: string;
}
