/**
 * Tests unitaires pour POST /api/signup
 * Plan Master P1.3 — coverage critique du parcours signup autonome.
 *
 * Scénarios couverts :
 *  1. Rate limit dépassé → 429
 *  2. Payload invalide (Zod) → 400
 *  3. Firebase createUser fail (email pris) → 400
 *  4. Provisioning fail → rollback deleteUser + 500
 *  5. Success 201 → { tenantId, uid, checkoutUrl } + custom claims set
 *  6. tenantId collision → resolveFreeTenantId génère un suffix
 *  7. Stripe checkout fail → 201 sans checkoutUrl (soft-fail)
 *  8. BrandingService fail → 201 quand même (soft-fail)
 *  9. sendEmail fail → 201 quand même (fire-and-forget)
 * 10. tenantId allocation fail après 6 essais → 500
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockCreateUser = vi.fn();
const mockSetCustomClaims = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('@/lib/auth/ServerAuthProvider', () => ({
    getServerAuthProvider: vi.fn(() => ({
        createUser: mockCreateUser,
        setCustomClaims: mockSetCustomClaims,
        deleteUser: mockDeleteUser,
    })),
}));

const mockProvisionNewInstance = vi.fn();
vi.mock('@/lib/ProvisioningEngine', () => ({
    ProvisioningEngine: {
        provisionNewInstance: mockProvisionNewInstance,
    },
}));

const mockExtractFromUrl = vi.fn();
vi.mock('@/lib/BrandingService', () => ({
    BrandingService: {
        extractFromUrl: mockExtractFromUrl,
    },
}));

const mockCreateCheckoutSession = vi.fn();
vi.mock('@/modules/finance', () => ({
    BillingService: {
        createCheckoutSession: mockCreateCheckoutSession,
    },
}));

const mockNexusGet = vi.fn();
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: mockNexusGet,
        },
    },
}));

const mockRateCheck = vi.fn();
vi.mock('@/infrastructure/services/rate-limiter', () => ({
    getRateLimiter: vi.fn(() => ({
        check: mockRateCheck,
    })),
}));

const mockSendEmail = vi.fn();
vi.mock('@/lib/email-service', () => ({
    sendEmail: mockSendEmail,
}));

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest('http://localhost/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'origin': 'http://localhost', ...headers },
        body: JSON.stringify(body),
    });
}

const VALID_BODY = {
    email: 'owner@resto.fr',
    password: 'secret1234',
    businessName: 'La Belle Assiette',
    variant: 'restaurant',
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/signup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Defaults : happy path
        mockRateCheck.mockResolvedValue({ allowed: true });
        mockNexusGet.mockResolvedValue(null); // aucun tenant existant
        mockCreateUser.mockResolvedValue({ uid: 'uid_test_123' });
        mockSetCustomClaims.mockResolvedValue(undefined);
        mockProvisionNewInstance.mockResolvedValue(undefined);
        mockCreateCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.test/session123' });
        mockSendEmail.mockResolvedValue(undefined);
        mockExtractFromUrl.mockResolvedValue({ primaryColor: '#c00' });
    });

    it('1. rate limit dépassé → 429', async () => {
        mockRateCheck.mockResolvedValueOnce({ allowed: false });
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(429);
    });

    it('2. payload invalide (email KO) → 400 avec details', async () => {
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, email: 'not-an-email' }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('Champs invalides');
        expect(json.details).toBeDefined();
    });

    it('2b. password trop court → 400', async () => {
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'short' }));
        expect(res.status).toBe(400);
    });

    it('3. Firebase createUser fail → 400 (aucun rollback nécessaire)', async () => {
        mockCreateUser.mockRejectedValueOnce(new Error('EMAIL_EXISTS'));
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(400);
        expect(mockDeleteUser).not.toHaveBeenCalled();
        expect(mockProvisionNewInstance).not.toHaveBeenCalled();
    });

    it('4. provisioning fail → rollback deleteUser + 500', async () => {
        mockProvisionNewInstance.mockRejectedValueOnce(new Error('SEED_FAILED'));
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(500);
        expect(mockDeleteUser).toHaveBeenCalledWith('uid_test_123');
    });

    it('5. success → 201 avec tenantId/uid/checkoutUrl + custom claims setés', async () => {
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.tenantId).toBe('la-belle-assiette');
        expect(json.uid).toBe('uid_test_123');
        expect(json.checkoutUrl).toBe('https://checkout.stripe.test/session123');

        expect(mockSetCustomClaims).toHaveBeenCalledWith('uid_test_123', {
            tenantId: 'la-belle-assiette',
            clientId: 'la-belle-assiette',
            role: 'admin',
        });
    });

    it('6. tenantId collision → resolveFreeTenantId génère un suffix', async () => {
        // Premier get → tenant existe déjà, deuxième → libre
        mockNexusGet
            .mockResolvedValueOnce({ id: 'la-belle-assiette' })
            .mockResolvedValueOnce(null);

        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(201);
        const json = await res.json();
        // Le tenantId a un suffix (6 chars random)
        expect(json.tenantId).toMatch(/^la-belle-assiette-[a-f0-9]{6}$/);
    });

    it('7. Stripe checkout fail → 201 sans checkoutUrl (soft-fail)', async () => {
        mockCreateCheckoutSession.mockRejectedValueOnce(new Error('STRIPE_DOWN'));
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.checkoutUrl).toBeNull();
        expect(json.tenantId).toBe('la-belle-assiette');
    });

    it('8. BrandingService.extractFromUrl fail → 201 quand même', async () => {
        mockExtractFromUrl.mockRejectedValueOnce(new Error('BRAND_FAIL'));
        const bodyWithUrl = { ...VALID_BODY, websiteUrl: 'https://example.com' };

        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(bodyWithUrl));
        expect(res.status).toBe(201);
        // Provisioning appelé sans initialPrimaryColor
        expect(mockProvisionNewInstance).toHaveBeenCalledWith(
            expect.not.objectContaining({ initialPrimaryColor: expect.any(String) }),
        );
    });

    it('9. sendEmail fail → 201 quand même (fire-and-forget)', async () => {
        mockSendEmail.mockRejectedValueOnce(new Error('SMTP_DOWN'));
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(201);
    });

    it('10. tenantId allocation fail après 6 essais → 500', async () => {
        // Nexus retourne toujours un tenant existant → tous les slots occupés
        mockNexusGet.mockResolvedValue({ id: 'occupé' });

        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest(VALID_BODY));
        expect(res.status).toBe(500);
        expect(mockCreateUser).not.toHaveBeenCalled(); // pas de user créé si allocation impossible
    });

    it('11. variant explicite (bakery) propagé au provisioning', async () => {
        const { POST } = await import('@/app/api/signup/route');
        await POST(buildRequest({ ...VALID_BODY, variant: 'bakery' }));
        expect(mockProvisionNewInstance).toHaveBeenCalledWith(
            expect.objectContaining({ variant: 'bakery' }),
        );
    });

    it('12. tenantId normalisé depuis businessName (accents supprimés)', async () => {
        const { POST } = await import('@/app/api/signup/route');
        const res = await POST(buildRequest({ ...VALID_BODY, businessName: 'Café des Amis' }));
        expect(res.status).toBe(201);
        const json = await res.json();
        // 'Café des Amis' → 'cafe-des-amis' (accents strippés)
        expect(json.tenantId).toBe('cafe-des-amis');
    });
});
