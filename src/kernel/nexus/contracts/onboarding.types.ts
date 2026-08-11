/**
 * OnboardingState — état du parcours d'onboarding B2B d'un tenant.
 * Persisté dans tenantConfig (merge post-seeding).
 */

export type ImportCategory =
  | 'menu'
  | 'staff'
  | 'crm'
  | 'suppliers'
  | 'inventory'
  | 'recipes'
  | 'reservations'
  | 'statements'
  | 'fec'
  | 'floorplan'
  | 'haccp_history';
export type ConnectorId = 'lightspeed' | 'zelty' | 'clover' | 'square' | 'sumup' | 'laddition' | 'custom' | string;

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
    snapshotId?: string;
}

export interface OnboardingConnectorCredentials {
    provider: ConnectorId;
    encryptedToken: string;
    expiresAt?: string;
    accountName?: string;
}

export interface ConnectorCredentials {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    expiresAt?: string;
    extra?: Record<string, string>;
}

export interface OnboardingState {
    mode: OnboardingMode;
    sourceSystem?: ConnectorId;
    startedAt: string;
    completedAt?: string;

    steps: Partial<Record<ImportCategory | 'floorplan' | 'team' | 'suppliers-setup', OnboardingStepState>>;

    connectorCredentials?: OnboardingConnectorCredentials;

    currentStep?: string;

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
        hasAdmin: true,
        hasFiscalGenesis: true,
    },
};
