import { describe, it, expect } from 'vitest';
import {
    CustomFieldDefSchema,
    currencyToMicrounits,
    microunitsToCurrency,
    validateCustomFieldValue,
} from '@/shared/custom-fields';
import {
    PageLayoutConfigSchema,
    LayoutSlotSchema,
} from '@/shared/layout-builder';
import {
    BrandTokensSchema,
    sanitizeBrandValue,
} from '@/shared/nexus/tokens/brand';
import { tenantBrandingFromScrape } from '@/lib/tenantBrandingFromScrape';
import { filterByUXProfile, NAV_SECTIONS } from '@/config/navConfig';
import type { CompanyProfile } from '@/modules/commerce';

describe('🧪 Ultra-Customisation V2 Test Suite', () => {
    describe('1. Custom Fields Engine & Currency Safety', () => {
        it('converts currency display to microunits without float errors (Charte §5)', () => {
            expect(currencyToMicrounits(12.5)).toBe(1250);
            expect(currencyToMicrounits(0.1 + 0.2)).toBe(30);
            expect(microunitsToCurrency(1250)).toBe(12.5);
        });

        it('validates custom field definitions against Zod schema', () => {
            const validDef = {
                id: 'field_immat',
                key: 'immatriculation_vehicule',
                label: 'Immatriculation',
                type: 'text',
                required: true,
                entity: 'customer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const parsed = CustomFieldDefSchema.safeParse(validDef);
            expect(parsed.success).toBe(true);
        });

        it('rejects invalid snake_case keys in custom fields', () => {
            const invalidDef = {
                id: 'field_1',
                key: 'INVALID KEY WITH SPACES',
                label: 'Test',
                type: 'text',
                entity: 'customer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const parsed = CustomFieldDefSchema.safeParse(invalidDef);
            expect(parsed.success).toBe(false);
        });

        it('validates custom field values correctly by type', () => {
            const fieldDef = CustomFieldDefSchema.parse({
                id: 'rating_1',
                key: 'satisfaction_client',
                label: 'Note',
                type: 'rating',
                entity: 'customer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            expect(validateCustomFieldValue(fieldDef, 5)).toBe(true);
            expect(validateCustomFieldValue(fieldDef, 6)).toContain('1 et 5 étoiles');
        });
    });

    describe('2. Layout Builder & NF525 Invariant', () => {
        it('enforces NF525 invariant: locked slot CANNOT have visible: false', () => {
            const invalidSlot = {
                id: 'seal_zone',
                componentKey: 'fiscal_seal',
                label: 'Sceau Fiscal',
                position: { x: 0, y: 0, w: 12, h: 2 },
                visible: false, // ❌ Violation
                locked: true,
            };
            const parsed = LayoutSlotSchema.safeParse(invalidSlot);
            expect(parsed.success).toBe(false);
        });

        it('accepts valid layout configuration with locked slots', () => {
            const validLayout = {
                pageId: 'pos',
                device: 'desktop',
                tenantId: 'tenant_123',
                grid: { columns: 12, rows: 6, gap: '12px' },
                slots: [
                    {
                        id: 'slot_cart',
                        componentKey: 'cart_dock',
                        label: 'Panier',
                        position: { x: 0, y: 0, w: 4, h: 6 },
                        visible: true,
                        locked: false,
                    },
                    {
                        id: 'slot_seal',
                        componentKey: 'fiscal_seal',
                        label: 'Sceau Fiscal NF525',
                        position: { x: 0, y: 5, w: 4, h: 1 },
                        visible: true,
                        locked: true,
                    },
                ],
            };
            const parsed = PageLayoutConfigSchema.safeParse(validLayout);
            expect(parsed.success).toBe(true);
        });
    });

    describe('3. Brand Tokens & XSS Sanitization', () => {
        it('blocks javascript: protocols in sanitization', () => {
            expect(sanitizeBrandValue('javascript:alert(1)')).toBe('');
            expect(sanitizeBrandValue('data:text/html,<script></script>')).toBe('');
            expect(sanitizeBrandValue('#C5A059')).toBe('#C5A059');
        });

        it('validates safe asset domains', () => {
            const valid = BrandTokensSchema.safeParse({
                tenantId: 't1',
                brandName: 'Brasserie',
                logoUrl: 'https://firebasestorage.googleapis.com/v0/b/app/o/logo.png',
            });
            expect(valid.success).toBe(true);

            const invalid = BrandTokensSchema.safeParse({
                tenantId: 't1',
                brandName: 'Brasserie',
                logoUrl: 'https://evil-site.com/malicious.png',
            });
            expect(invalid.success).toBe(false);
        });
    });

    describe('4. Enriched Scraped Branding Overlay (16 fields)', () => {
        it('projects colors, auto-hover, typography and ambiance from scraped profile', () => {
            const profile: CompanyProfile = {
                identity: { name: 'Brasserie Test', siren: '123456789', legalName: 'Brasserie Test' },
                sectorSignals: { detectedVariant: 'restaurant', confidence: 0.9, evidence: [] },
                catalog: [],
                scale: { evidence: [] },
                raw: { pagesCrawled: ['https://test.example'], jsonLdBlocks: 1, warnings: [], scrapedAt: new Date().toISOString() },
                branding: {
                    source: 'scraped',
                    primaryColor: '#8B4513',
                    secondaryColor: '#A0522D',
                    fontFamily: 'Playfair Display',
                    logoUrl: 'https://firebasestorage.googleapis.com/logo.png',
                    primaryHover: '#743910',
                    fontBrand: 'Playfair Display',
                    appearance: 'dark',
                } as unknown as CompanyProfile['branding'],
            };

            const overlay = tenantBrandingFromScrape(profile);
            expect(overlay).not.toBeNull();
            expect(overlay?.primaryColor).toBe('#8B4513');
            expect(overlay?.secondaryColor).toBe('#A0522D');
            expect(overlay?.primaryHover).toBe('#743910');
            expect(overlay?.fontBrand).toBe('Playfair Display');
            expect(overlay?.appearance).toBe('dark');
        });
    });

    describe('5. UXProfile Navigation Wiring', () => {
        it('filters sections based on switchboard flags', () => {
            const filtered = filterByUXProfile(NAV_SECTIONS, {
                switchboard: { enableBarTabs: false },
            });
            const hasBar = filtered.some(s => s.items.some(i => i.key === 'bar'));
            expect(hasBar).toBe(false);
        });

        it('reorders sections based on navigationOrder', () => {
            const customOrder = ['compliance', 'operations', 'core'];
            const reordered = filterByUXProfile(NAV_SECTIONS, {
                navigation: { navigationOrder: customOrder },
            });
            const firstId = reordered[0]?.id;
            expect(firstId).toBe('compliance');
        });
    });
});
