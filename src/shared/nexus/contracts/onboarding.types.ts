/**
 * OnboardingState & CompanyProfile — contrats d'onboarding B2B d'un tenant.
 * Réside dans shared/nexus/contracts pour respecter la Loi des Couches (ADR-015).
 */

import type { Microunits } from '@/shared/schemas/primitives';

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

export type ConnectorId =
    | 'zenchef'
    | 'thefork'
    | 'zelty'
    | 'laddition'
    | 'lightspeed'
    | 'tiller'
    | 'pennylane'
    | 'sage'
    | 'cashpad'
    | 'popina';

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

// ── CompanyProfile contracts ──────────────────────────────────────────────────

export interface CompanyIdentity {
    name: string;
    legalName?: string;
    siren?: string;
    address?: {
        street?: string;
        postalCode?: string;
        city?: string;
        country?: string;
    };
    phone?: string;
    email?: string;
    openingHours?: Record<string, string>;
}

export interface SectorSignals {
    detectedVariant: string;
    subVariantHint?: string;
    confidence: number;
    evidence: string[];
}

export interface ExtractedProductItem {
    id: string;
    name: string;
    description: string;
    priceInMicrounits: Microunits;
    taxRate: number;
    category: string;
    isAvailable: boolean;
    sourceUrl?: string;
}

export interface CompanyBranding {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
    source: 'scraped' | 'default';
}

export interface CompanyScale {
    estimatedStaff?: number;
    multiSite?: boolean;
    siteCount?: number;
    evidence: string[];
}

export interface CompanyScrapeRaw {
    pagesCrawled: string[];
    jsonLdBlocks: number;
    warnings: string[];
    scrapedAt: string;
}

export interface CompanyProfile {
    identity: CompanyIdentity;
    sectorSignals: SectorSignals;
    catalog: ExtractedProductItem[];
    branding: CompanyBranding;
    scale: CompanyScale;
    raw: CompanyScrapeRaw;
}
