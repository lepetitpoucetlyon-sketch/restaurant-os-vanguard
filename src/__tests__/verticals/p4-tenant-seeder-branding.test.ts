/**
 * 🧪 P4 — TenantSeeder branche `brandingOverlay` (issu de `tenantBrandingFromScrape`)
 * au provisioning.
 *
 * Refactor sentrux : TenantSeeder n'importe pas CompanyProfile directement (fan-out).
 * Le pipeline caller = `tenantBrandingFromScrape(profile) → SeedInput.brandingOverlay`.
 *
 * Prouve concrètement :
 *  1. Sans overlay → comportement historique inchangé (primaryColor fallback).
 *  2. Avec overlay scrapé → écrase la primaryColor de la DNA, ajoute
 *     secondaryColor / logoUrl / fontFamily si présents.
 *  3. `tenantBrandingFromScrape` renvoie null pour un branding `source: 'default'`.
 *  4. `buildBrandTokens` (tier CLIENT/REFERENCE) utilise l'overlay et bascule
 *     `brandingMode: 'custom'`.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { buildBrandTokens, TenantSeeder, type SeedInput } from '@/lib/TenantSeeder';
import {
    tenantBrandingFromScrape,
    scrapedSiren,
    type ScrapedBrandingOverlay,
} from '@/lib/tenantBrandingFromScrape';
import type { CompanyProfile } from '@/modules/commerce/acquisition/onboarding/schemas/companyProfile';
import { Nexus } from '@/lib/nexus/NexusAdapter';

vi.mock('@/lib/nexus/NexusAdapter', () => {
    const store = new Map<string, unknown>();
    return {
        Nexus: {
            adapter: {
                get: vi.fn(async (path: string) => store.get(path) ?? null),
                set: vi.fn(async (path: string, data: unknown) => {
                    store.set(path, data);
                }),
                delete: vi.fn(async (path: string) => {
                    store.delete(path);
                }),
            },
            __store: store,
        },
    };
});

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/modules/finance', () => ({
    FiscalKeyService: {
        generateKey: () => 'test-fiscal-key-abc',
    },
}));

vi.mock('@/modules/intelligence', () => ({
    ConnectorHub: {
        getAutoActivated: () => [],
    },
}));

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
    NexusEventBus: {
        emit: vi.fn(async () => {}),
    },
}));

vi.mock('@/lib/mcc/SystemTenantRegistry', () => ({
    getSystemTenantTier: () => null, // CLIENT tier
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

function scrapedProfile(overrides: Partial<CompanyProfile['branding']> = {}): CompanyProfile {
    return {
        identity: { name: 'Bistro Chez Marie', siren: '123456789' },
        sectorSignals: {
            detectedVariant: 'restaurant',
            confidence: 0.87,
            evidence: ['JSON-LD @type=Restaurant'],
        },
        catalog: [],
        branding: {
            primaryColor: '#FF6B35',
            source: 'scraped',
            ...overrides,
        },
        scale: { evidence: [] },
        raw: {
            pagesCrawled: ['https://bistro.example/'],
            jsonLdBlocks: 1,
            warnings: [],
            scrapedAt: '2026-08-23T12:00:00.000Z',
        },
    };
}

// ── 1. tenantBrandingFromScrape helper (frontière décorrélante) ────────────────

describe('tenantBrandingFromScrape — helper standalone', () => {
    it('undefined profile → null', () => {
        expect(tenantBrandingFromScrape(undefined)).toBeNull();
    });

    it('branding source=default → null (repli, non écrasable)', () => {
        const profile = scrapedProfile();
        profile.branding = { primaryColor: '#C5A059', source: 'default' };
        expect(tenantBrandingFromScrape(profile)).toBeNull();
    });

    it('branding scraped → overlay avec tous les champs présents', () => {
        const overlay = tenantBrandingFromScrape(
            scrapedProfile({
                secondaryColor: '#FFB84D',
                logoUrl: 'https://bistro.example/logo.svg',
                fontFamily: 'Playfair',
            }),
        );
        expect(overlay).toEqual({
            primaryColor: '#FF6B35',
            secondaryColor: '#FFB84D',
            logoUrl: 'https://bistro.example/logo.svg',
            fontFamily: 'Playfair',
        });
    });

    it('branding scraped minimal → overlay avec primaryColor uniquement', () => {
        const overlay = tenantBrandingFromScrape(scrapedProfile());
        expect(overlay).toEqual({ primaryColor: '#FF6B35' });
    });

    it('scrapedSiren renvoie identity.siren si présent', () => {
        expect(scrapedSiren(scrapedProfile())).toBe('123456789');
        expect(scrapedSiren(undefined)).toBeUndefined();
    });
});

// ── 2. TenantSeeder.seed avec / sans brandingOverlay ───────────────────────────

describe('TenantSeeder.seed — brandingOverlay', () => {
    beforeEach(() => {
         
        (Nexus as unknown as { __store: Map<string, unknown> }).__store.clear();
        vi.clearAllMocks();
    });

    it('sans overlay → primaryColor fallback (input ou DNA)', async () => {
        const input: SeedInput = {
            tenantId: 't_no_overlay',
            name: 'Test A',
            adminEmail: 'a@test.io',
            variant: 'restaurant',
            adminPin: '4231',
            primaryColor: '#123456',
        };
        const result = await TenantSeeder.seed(input);
        expect(result.success).toBe(true);
        const cfg = await Nexus.adapter.get('tenants/t_no_overlay/tenantConfig') as {
            theme: { primaryColor: string; logoUrl?: string };
        };
        expect(cfg.theme.primaryColor).toBe('#123456');
    });

    it('avec overlay → primaryColor scrapée gagne sur input.primaryColor + ajoute logo/font', async () => {
        const overlay: ScrapedBrandingOverlay = {
            primaryColor: '#FF6B35',
            secondaryColor: '#FFB84D',
            logoUrl: 'https://bistro.example/logo.svg',
            fontFamily: 'Playfair Display',
        };
        const input: SeedInput = {
            tenantId: 't_overlay',
            name: 'Bistro',
            adminEmail: 'chef@bistro.io',
            variant: 'restaurant',
            adminPin: '5192',
            primaryColor: '#000000', // input battu par l'overlay
            brandingOverlay: overlay,
        };
        const result = await TenantSeeder.seed(input);
        expect(result.success).toBe(true);
        const cfg = await Nexus.adapter.get('tenants/t_overlay/tenantConfig') as {
            theme: {
                primaryColor: string;
                secondaryColor?: string;
                logoUrl?: string;
                fontFamily?: string;
            };
        };
        expect(cfg.theme.primaryColor).toBe('#FF6B35');
        expect(cfg.theme.secondaryColor).toBe('#FFB84D');
        expect(cfg.theme.logoUrl).toBe('https://bistro.example/logo.svg');
        expect(cfg.theme.fontFamily).toBe('Playfair Display');
    });

    it('siren pré-calculé via scrapedSiren transmis dans input.siren', async () => {
        const profile = scrapedProfile();
        const input: SeedInput = {
            tenantId: 't_siren',
            name: 'Siren',
            adminEmail: 's@s.io',
            variant: 'salon',
            adminPin: '8351',
            siren: scrapedSiren(profile),
            brandingOverlay: tenantBrandingFromScrape(profile) ?? undefined,
        };
        await TenantSeeder.seed(input);
        const cfg = await Nexus.adapter.get('tenants/t_siren/tenantConfig') as {
            metadata: { siren: string };
        };
        expect(cfg.metadata.siren).toBe('123456789');
    });
});

// ── 3. buildBrandTokens — bascule brandingMode ─────────────────────────────────

describe('buildBrandTokens — overlay bascule brandingMode custom', () => {
    it('sans overlay → brandingMode default', () => {
        const tokens = buildBrandTokens('t_1', null, {
            tenantId: 't_1',
            name: 'Test',
            adminEmail: 'a@a.io',
            primaryColor: '#111111',
        });
        expect(tokens.brandingMode).toBe('default');
        expect(tokens.primaryColor).toBe('#111111');
        expect(tokens.logoUrl).toBeNull();
    });

    it('avec overlay → brandingMode custom + logo', () => {
        const tokens = buildBrandTokens('t_2', null, {
            tenantId: 't_2',
            name: 'Bistro',
            adminEmail: 'a@a.io',
            brandingOverlay: {
                primaryColor: '#FF6B35',
                logoUrl: 'https://cdn.example/logo.png',
            },
        });
        expect(tokens.brandingMode).toBe('custom');
        expect(tokens.primaryColor).toBe('#FF6B35');
        expect(tokens.logoUrl).toBe('https://cdn.example/logo.png');
    });

    it('tier DEMO — non affecté par overlay (env préconstruit)', () => {
        const tokens = buildBrandTokens('t_d', 'DEMO', {
            tenantId: 't_d',
            name: 'Demo',
            adminEmail: 'a@a.io',
            variant: 'restaurant',
            brandingOverlay: {
                primaryColor: '#FF6B35',
                logoUrl: 'https://x/y',
            },
        });
        expect(tokens.brandingMode).toBe('custom'); // DEMO est toujours custom
        expect(tokens.splashEnabled).toBe(true);
        expect(tokens.logoUrl).toBeNull();
    });

    it('tier REFERENCE — imperméable aux overlays scrapés, reste default et gold neutre', () => {
        const tokens = buildBrandTokens('_ref_restaurant', 'REFERENCE', {
            tenantId: '_ref_restaurant',
            name: 'Reference Template',
            adminEmail: 'admin@ref.internal',
            variant: 'restaurant',
            brandingOverlay: {
                primaryColor: '#FF0000',
                logoUrl: 'https://client.example/logo.png',
            },
        });
        expect(tokens.brandingMode).toBe('default');
        expect(tokens.primaryColor).toBe('#C5A358');
        expect(tokens.logoUrl).toBeNull();
        expect(tokens.splashEnabled).toBe(false);
        expect(tokens.brandName).toBe('Restaurant OS · Référence restaurant');
        expect(tokens.tagline).toBe('Matrice de référence — lecture seule');
    });

    it('tier TEST — imperméable aux overlays scrapés, reste default et bleu dev', () => {
        const tokens = buildBrandTokens('_test_restaurant', 'TEST', {
            tenantId: '_test_restaurant',
            name: 'Restaurant Dev',
            adminEmail: 'admin@test.internal',
            variant: 'restaurant',
            brandingOverlay: {
                primaryColor: '#FF0000',
                logoUrl: 'https://client.example/logo.png',
            },
        });
        expect(tokens.brandingMode).toBe('default');
        expect(tokens.primaryColor).toBe('#3B82F6');
        expect(tokens.logoUrl).toBeNull();
        expect(tokens.splashEnabled).toBe(false);
    });
});
