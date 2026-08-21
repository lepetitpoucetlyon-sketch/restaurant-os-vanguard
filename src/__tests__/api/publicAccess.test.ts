/**
 * Tests unitaires pour /api/admin/fleet/public-access.
 * Kill-switch MCC landing + signup public.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockNexusGet = vi.fn();
const mockNexusSet = vi.fn();
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: mockNexusGet,
            set: mockNexusSet,
        },
    },
}));

const mockRequireMccLevel = vi.fn();
const mockIsDenied = vi.fn();
vi.mock('@/lib/server/adminAuthGuard', () => ({
    requireMccLevel: (...args: unknown[]) => mockRequireMccLevel(...args),
    isDenied: (v: unknown) => mockIsDenied(v),
}));

const mockChangelogRecord = vi.fn();
vi.mock('@/lib/mcc/ChangelogService', () => ({
    ChangelogService: { record: mockChangelogRecord },
}));

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function req(body?: unknown): NextRequest {
    const init: { method: string; headers: Record<string, string>; body?: string } = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    return new NextRequest('http://localhost/api/admin/fleet/public-access', init);
}

async function importFresh() {
    vi.resetModules();
    const { invalidatePublicAccessCache } = await import('@/lib/mcc/PublicAccessConfig');
    invalidatePublicAccessCache();
    return await import('@/app/api/admin/fleet/public-access/route');
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/admin/fleet/public-access', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNexusGet.mockResolvedValue(null); // aucune config par défaut → DEFAULT
        mockNexusSet.mockResolvedValue(undefined);
        mockChangelogRecord.mockResolvedValue(undefined);
        mockRequireMccLevel.mockResolvedValue({ uid: 'admin_test', role: 'mcc_super_admin' });
        mockIsDenied.mockReturnValue(false);
    });

    it('GET retourne la config courante (fallback DEFAULT si vide)', async () => {
        const { GET } = await importFresh();
        const res = await GET();
        const json = await res.json();
        expect(json.config.landingEnabled).toBe(true);
        expect(json.config.signupEnabled).toBe(true);
    });

    it('POST refuse un caller non-super_admin', async () => {
        const deniedResponse = new Response(null, { status: 403 });
        mockRequireMccLevel.mockResolvedValueOnce(deniedResponse);
        mockIsDenied.mockReturnValueOnce(true);
        const { POST } = await importFresh();
        const res = await POST(req({ landingEnabled: false }));
        expect(res.status).toBe(403);
        expect(mockNexusSet).not.toHaveBeenCalled();
    });

    it('POST invalid JSON → 400', async () => {
        const brokenReq = new NextRequest('http://localhost/api/admin/fleet/public-access', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{not-json',
        });
        const { POST } = await importFresh();
        const res = await POST(brokenReq);
        expect(res.status).toBe(400);
    });

    it('POST landingEnabled=false → écrit dans Nexus + Changelog', async () => {
        const { POST } = await importFresh();
        const res = await POST(req({ landingEnabled: false }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.config.landingEnabled).toBe(false);
        expect(json.config.signupEnabled).toBe(true); // inchangé
        expect(json.config.updatedBy).toBe('admin_test');
        expect(json.config.updatedAt).toBeDefined();

        expect(mockNexusSet).toHaveBeenCalledWith(
            'mcc/publicAccess/config',
            expect.objectContaining({ landingEnabled: false, signupEnabled: true }),
        );
        expect(mockChangelogRecord).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'PUBLIC_ACCESS_UPDATED',
                scope: 'fleet',
                appliedBy: 'admin_test',
            }),
        );
    });

    it('POST accepte disabledMessage custom', async () => {
        const { POST } = await importFresh();
        const res = await POST(req({
            signupEnabled: false,
            disabledMessage: 'Reprise le 1er septembre',
        }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.config.disabledMessage).toBe('Reprise le 1er septembre');
    });

    it('POST refuse disabledMessage > 500 chars', async () => {
        const { POST } = await importFresh();
        const res = await POST(req({
            disabledMessage: 'x'.repeat(501),
        }));
        expect(res.status).toBe(400);
        expect(mockNexusSet).not.toHaveBeenCalled();
    });

    it('POST partial patch conserve les valeurs existantes non fournies', async () => {
        // Config existante = landing OFF, signup ON, message custom
        mockNexusGet.mockResolvedValue({
            landingEnabled: false,
            signupEnabled: true,
            disabledMessage: 'Message existant',
        });
        const { POST } = await importFresh();
        // On patch UNIQUEMENT signupEnabled
        const res = await POST(req({ signupEnabled: false }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.config.landingEnabled).toBe(false);        // conservé
        expect(json.config.signupEnabled).toBe(false);         // mis à jour
        expect(json.config.disabledMessage).toBe('Message existant'); // conservé
    });
});

describe('getPublicAccessConfig — fail-open behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fallback ouvert si Nexus throw', async () => {
        mockNexusGet.mockRejectedValueOnce(new Error('NEXUS_DOWN'));
        vi.resetModules();
        const { getPublicAccessConfig, invalidatePublicAccessCache } = await import('@/lib/mcc/PublicAccessConfig');
        invalidatePublicAccessCache();
        const cfg = await getPublicAccessConfig();
        expect(cfg.landingEnabled).toBe(true);
        expect(cfg.signupEnabled).toBe(true);
    });

    it('fallback ouvert si config Nexus mal formée', async () => {
        mockNexusGet.mockResolvedValueOnce({ garbage: 'invalid' });
        vi.resetModules();
        const { getPublicAccessConfig, invalidatePublicAccessCache } = await import('@/lib/mcc/PublicAccessConfig');
        invalidatePublicAccessCache();
        const cfg = await getPublicAccessConfig();
        // Zod safeParse échoue → fallback DEFAULT (ouvert)
        expect(cfg.landingEnabled).toBe(true);
        expect(cfg.signupEnabled).toBe(true);
    });
});
