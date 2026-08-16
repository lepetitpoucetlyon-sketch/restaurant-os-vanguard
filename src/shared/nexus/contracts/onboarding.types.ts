/**
 * OnboardingState — état du parcours d'onboarding B2B d'un tenant.
 * Persisté dans tenantConfig (merge post-seeding).
 */

import type { ImportCategory, ConnectorId } from '@/modules/commerce';

export type OnboardingMode = 'from_zero' | 'migration' | 'skipped';

export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type OnboardingImportSource = 'manual' | 'csv' | 'xlsx' | 'api' | 'ocr' | 'template';

export interface OnboardingStepState {
    status: OnboardingStepStatus;
    completedAt?: string;
    source?: OnboardingImportSource;
    importResult?: {
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    };
    /** Snapshot ID pour rollback */
    snapshotId?: string;
}

export interface OnboardingConnectorCredentials {
    provider: ConnectorId;
    /** Token chiffré côté serveur — jamais en clair dans Firestore */
    encryptedToken: string;
    expiresAt?: string;
    accountName?: string;
}

export interface OnboardingState {
    mode: OnboardingMode;
    /** Système source si mode=migration */
    sourceSystem?: ConnectorId;
    startedAt: string;
    completedAt?: string;

    steps: Partial<Record<ImportCategory | 'floorplan' | 'team' | 'suppliers-setup', OnboardingStepState>>;

    /** Credentials connecteur chiffrés (stockés temporairement pendant l'onboarding) */
    connectorCredentials?: OnboardingConnectorCredentials;

    /** Wizard — étape affichée actuellement */
    currentStep?: string;

    /** Checklist "prêt à ouvrir" */
    readyToOpen: boolean;
    readyChecks: {
        hasTable: boolean;
        hasProduct: boolean;
        hasAdmin: boolean;
        hasFiscalGenesis: boolean;
    };
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
    mode: 'from_zero',
    startedAt: new Date().toISOString(),
    steps: {},
    readyToOpen: false,
    readyChecks: {
        hasTable: false,
        hasProduct: false,
        hasAdmin: true,       // l'admin est créé par TenantSeeder
        hasFiscalGenesis: true, // GENESIS seal créé par TenantSeeder
    },
};
