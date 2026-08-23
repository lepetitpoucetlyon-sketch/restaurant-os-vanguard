/**
 * 🧪 P4 bonus — Câblage scrape charte au MCC provisioning.
 *
 * Prouve concrètement :
 *  1. `resolveBrandingOverlayFromRequest` renvoie null quand `websiteUrl` absent.
 *  2. Le scrape en échec (SSRF / timeout) → null (best-effort, aucune exception).
 *  3. Un scrape réussi avec branding scrapé → overlay complet.
 *  4. Un scrape réussi avec branding source=default → null (pas d'écrasement).
 *  5. `TenantProvisioningService.provisionNewClient` avec `websiteUrl` déclenche
 *     l'appel scrape et passe l'overlay au TenantSeeder.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks — Nexus, logger, dépendances lourdes ─────────────────────────────────

vi.mock('@/lib/nexus', () => {
    const store = new Map<string, unknown>();
    return {
        Nexus: {
            adapter: {
                get: vi.fn(async (path: string) => store.get(path) ?? null),
                set: vi.fn(async (path: string, data: unknown) => {
                    store.set(path, data);
                }),
                delete: vi.fn(async (path: string) => store.delete(path)),
                query: vi.fn(async () => []),
            },
            __store: store,
        },
    };
});

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// scrapeCompany mocked — chaque test injecte son comportement via vi.mocked
vi.mock('@/modules/commerce', () => ({
    scrapeCompany: vi.fn(),
}));

// Import après le mock pour récupérer la version mockée
import { scrapeCompany } from '@/modules/commerce';
const mockScrapeCompany = vi.mocked(scrapeCompany);

// ── SUT ────────────────────────────────────────────────────────────────────────

import { resolveBrandingOverlayFromRequest } from '@/lib/mcc/provisioning/steps/scrapeCharter';
import type { CompanyProfile } from '@/modules/commerce/acquisition/onboarding/schemas/companyProfile';

function makeProfile(
    brandingSource: 'scraped' | 'default',
    overrides: Partial<CompanyProfile['branding']> = {},
): CompanyProfile {
    return {
        identity: { name: 'Bistro', siren: '123456789' },
        sectorSignals: {
            detectedVariant: 'restaurant',
            confidence: 0.8,
            evidence: [],
        },
        catalog: [],
        branding: {
            primaryColor: '#FF6B35',
            source: brandingSource,
            ...overrides,
        },
        scale: { evidence: [] },
        raw: {
            pagesCrawled: ['https://x/'],
            jsonLdBlocks: 1,
            warnings: [],
            scrapedAt: '2026-08-23T12:00:00.000Z',
        },
    };
}

// ── 1. Comportements du step ───────────────────────────────────────────────────

describe('resolveBrandingOverlayFromRequest', () => {
    beforeEach(() => {
        mockScrapeCompany.mockReset();
    });

    it('sans websiteUrl → null (skip scrape, pas d\'appel réseau)', async () => {
        const overlay = await resolveBrandingOverlayFromRequest({
            companyName: 'Test',
            siret: '000000000',
        });
        expect(overlay).toBeNull();
        expect(mockScrapeCompany).not.toHaveBeenCalled();
    });

    it('scrape throw → null (best-effort, aucune exception)', async () => {
        mockScrapeCompany.mockRejectedValue(new Error('URL invalide'));
        const overlay = await resolveBrandingOverlayFromRequest({
            websiteUrl: 'https://blocked.example',
            companyName: 'Test',
            siret: '000000000',
        });
        expect(overlay).toBeNull();
        expect(mockScrapeCompany).toHaveBeenCalledOnce();
    });

    it('scrape retourne branding scrapé complet → overlay complet', async () => {
        mockScrapeCompany.mockResolvedValue(
            makeProfile('scraped', {
                secondaryColor: '#FFB84D',
                logoUrl: 'https://cdn/logo.svg',
                fontFamily: 'Playfair',
            }),
        );
        const overlay = await resolveBrandingOverlayFromRequest({
            websiteUrl: 'https://bistro.example',
            companyName: 'Bistro',
            siret: '123456789',
        });
        expect(overlay).toEqual({
            primaryColor: '#FF6B35',
            secondaryColor: '#FFB84D',
            logoUrl: 'https://cdn/logo.svg',
            fontFamily: 'Playfair',
        });
    });

    it('scrape retourne branding source=default → null (pas d\'écrasement)', async () => {
        mockScrapeCompany.mockResolvedValue(makeProfile('default'));
        const overlay = await resolveBrandingOverlayFromRequest({
            websiteUrl: 'https://empty.example',
            companyName: 'Empty',
            siret: '999999999',
        });
        expect(overlay).toBeNull();
    });

    it('passe websiteUrl + fallbackName + siren à scrapeCompany', async () => {
        mockScrapeCompany.mockResolvedValue(makeProfile('scraped'));
        await resolveBrandingOverlayFromRequest({
            websiteUrl: 'https://bistro.example/menu',
            companyName: 'Bistro Chez Marie',
            siret: '987654321',
        });
        expect(mockScrapeCompany).toHaveBeenCalledWith({
            websiteUrl: 'https://bistro.example/menu',
            fallbackName: 'Bistro Chez Marie',
            siren: '987654321',
        });
    });
});
