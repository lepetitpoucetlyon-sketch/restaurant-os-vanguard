/**
 * Tests unitaires pour POST /api/billing/signup
 * Plan Master P1.3 — coverage critique du parcours B2B avec Stripe Checkout.
 *
 * Scénarios couverts :
 *  1. STRIPE_SECRET_KEY absent → 503
 *  2. Payload JSON invalide → 400
 *  3. companyName manquant → 400
 *  4. SIRET invalide → 400 (14 chiffres requis)
 *  5. ownerEmail invalide → 400
 *  6. Tier inconnu → 400
 *  7. priceId absent (env non configuré) → 503
 *  8. Success → { url } avec metadata bien remplie
 *  9. Stripe checkout.sessions.create fail → 500
 * 10. Tier ENTERPRISE remappé en 'PREMIUM' dans metadata.planId
 * 11. successUrl / cancelUrl personnalisés respectés
 * 12. customer_email transmis à Stripe
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockCheckoutCreate = vi.fn();
vi.mock('stripe', () => {
    class StripeMock {
        checkout = {
            sessions: { create: mockCheckoutCreate },
        };
    }
    return { default: StripeMock };
});

const mockGetStripePriceId = vi.fn();
vi.mock('@/shared/constants/pricing', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/constants/pricing')>();
    return {
        ...actual,
        getStripePriceId: (tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE') => mockGetStripePriceId(tier),
    };
});

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildRequest(body: unknown | null, headers: Record<string, string> = {}): NextRequest {
    const url = 'http://localhost/api/billing/signup';
    const init: { method: string; headers: Record<string, string>; body?: string } = {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
    };
    if (body !== null) init.body = JSON.stringify(body);
    return new NextRequest(url, init);
}

function buildBrokenRequest(): NextRequest {
    return new NextRequest('http://localhost/api/billing/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid json',
    });
}

const VALID_BODY = {
    companyName: 'Belle Boulangerie',
    siret: '12345678901234',
    ownerEmail: 'owner@belle.fr',
    ownerName: 'Marie Dupont',
    tier: 'STANDARD',
    primaryColor: '#c00',
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/billing/signup', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
        process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
        process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.io';

        mockGetStripePriceId.mockImplementation((tier: string) => {
            switch (tier) {
                case 'STANDARD': return 'price_std_test';
                case 'PREMIUM': return 'price_prem_test';
                case 'ENTERPRISE': return 'price_ent_test';
                default: return '';
            }
        });

        mockCheckoutCreate.mockResolvedValue({
            id: 'cs_test_abc',
            url: 'https://checkout.stripe.test/cs_test_abc',
        });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('1. STRIPE_SECRET_KEY absent → 503', async () => {
        delete process.env.STRIPE_SECRET_KEY;
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(503);
        const json = await res.json();
        expect(json.error).toMatch(/Stripe non configuré/);
    });

    it('2. Payload JSON invalide → 400', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildBrokenRequest());
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/JSON invalide/);
    });

    it('3. companyName manquant → 400', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, companyName: '' }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/companyName requis/);
    });

    it('4. SIRET invalide (non 14 chiffres) → 400', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, siret: '123' }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/siret invalide/);
    });

    it('5. ownerEmail invalide → 400', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, ownerEmail: 'not-email' }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/ownerEmail invalide/);
    });

    it('6. Tier inconnu → 400', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, tier: 'ULTRA' }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/Tier inconnu/);
    });

    it('7. priceId absent (env manquant) → 503', async () => {
        mockGetStripePriceId.mockReturnValueOnce('');
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(503);
        const json = await res.json();
        expect(json.error).toMatch(/Prix Stripe non configuré/);
    });

    it('8. Success → { url } avec metadata bien remplie', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.url).toBe('https://checkout.stripe.test/cs_test_abc');

        expect(mockCheckoutCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: 'subscription',
                customer_email: 'owner@belle.fr',
                metadata: expect.objectContaining({
                    companyName: 'Belle Boulangerie',
                    siret: '12345678901234',
                    ownerEmail: 'owner@belle.fr',
                    ownerName: 'Marie Dupont',
                    planId: 'STANDARD',
                    primaryColor: '#c00',
                }),
            }),
        );
    });

    it('9. Stripe checkout.sessions.create fail → 500', async () => {
        mockCheckoutCreate.mockRejectedValueOnce(new Error('STRIPE_API_DOWN'));
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(500);
    });

    it('10. Tier ENTERPRISE remappé en planId=PREMIUM dans metadata', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        await POST(buildRequest({ ...VALID_BODY, tier: 'ENTERPRISE' }));
        expect(mockCheckoutCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: expect.objectContaining({ planId: 'PREMIUM' }),
            }),
        );
    });

    it('11. successUrl / cancelUrl personnalisés respectés', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        await POST(
            buildRequest({
                ...VALID_BODY,
                successUrl: 'https://custom.io/ok',
                cancelUrl: 'https://custom.io/no',
            }),
        );
        expect(mockCheckoutCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                success_url: 'https://custom.io/ok',
                cancel_url: 'https://custom.io/no',
            }),
        );
    });

    it('12. successUrl par défaut construit depuis NEXT_PUBLIC_APP_URL', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        await POST(buildRequest(VALID_BODY));
        expect(mockCheckoutCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                success_url: 'https://app.test.io/welcome?status=success',
                cancel_url: 'https://app.test.io/pricing?status=cancelled',
            }),
        );
    });

    it('13. Tier par défaut = STANDARD si non fourni', async () => {
        const { tier: _tier, ...noTier } = VALID_BODY;
        const { POST } = await import('@/app/api/billing/signup/route');
        const res = await POST(buildRequest(noTier));
        expect(res.status).toBe(200);
        expect(mockCheckoutCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: expect.objectContaining({ planId: 'STANDARD' }),
            }),
        );
    });

    it('14. Session expire à 30 min', async () => {
        const { POST } = await import('@/app/api/billing/signup/route');
        await POST(buildRequest(VALID_BODY));
        const call = mockCheckoutCreate.mock.calls[0][0];
        const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 60;
        expect(call.expires_at).toBeGreaterThanOrEqual(expectedExpiry - 5);
        expect(call.expires_at).toBeLessThanOrEqual(expectedExpiry + 5);
    });
});
