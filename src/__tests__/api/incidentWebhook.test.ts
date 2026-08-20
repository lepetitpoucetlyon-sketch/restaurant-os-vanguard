import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/ops/incident-webhook/route';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

// Tests unitaires du webhook incident — critique pour l'auto-remédiation.
// On mock OpsAlertGateway.send et on vérifie le routage.

function buildReq(body: unknown, secret?: string): Request {
    const headers = new Headers({ 'content-type': 'application/json' });
    if (secret !== undefined) headers.set('x-ops-secret', secret);
    return new Request('http://localhost/api/ops/incident-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
}

describe('POST /api/ops/incident-webhook', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(OpsAlertGateway, 'send').mockResolvedValue(true);
        process.env = { ...originalEnv, OPS_WEBHOOK_SECRET: 'test-secret' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🔒 AUTH
    // ══════════════════════════════════════════════════════════════════════════

    describe('Authentification', () => {
        it('retourne 401 sans header x-ops-secret', async () => {
            const res = await POST(
                buildReq({ alertType: 'x', severity: 'info' }) as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(401);
        });

        it('retourne 401 avec mauvais secret', async () => {
            const res = await POST(
                buildReq({ alertType: 'x', severity: 'info' }, 'wrong') as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(401);
        });

        it('retourne 401 si OPS_WEBHOOK_SECRET absent en env', async () => {
            delete process.env.OPS_WEBHOOK_SECRET;
            const res = await POST(
                buildReq({ alertType: 'x', severity: 'info' }, 'test-secret') as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(401);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 📥 VALIDATION PAYLOAD
    // ══════════════════════════════════════════════════════════════════════════

    describe('Validation payload', () => {
        it('retourne 400 sur JSON invalide', async () => {
            const req = new Request('http://localhost/api/ops/incident-webhook', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-ops-secret': 'test-secret',
                },
                body: '{malformed',
            });
            const res = await POST(req as unknown as Parameters<typeof POST>[0]);
            expect(res.status).toBe(400);
        });

        it('retourne 400 sur severity inconnue', async () => {
            const res = await POST(
                buildReq({ alertType: 'x', severity: 'catastrophic' }, 'test-secret') as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(400);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🚨 HUMAN-ONLY : fiscal / sovereign JAMAIS auto-remédiés
    // ══════════════════════════════════════════════════════════════════════════

    describe('Escalade humaine forcée (fiscal / sovereign)', () => {
        it.each([
            'fiscal.chain.broken',
            'sovereign.breach',
            'fiscal.seal.invalid',
            'worm.integrity.failure',
        ])('escalade %s vers humain (jamais auto-remédié)', async (alertType) => {
            const res = await POST(
                buildReq(
                    { alertType, severity: 'critical', tenant: 't1' },
                    'test-secret',
                ) as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(200);
            const body = (await res.json()) as { action: string; reason?: string };
            expect(body.action).toBe('escalated_to_human');
            expect(body.reason).toMatch(/auto-remediation forbidden/);
            expect(OpsAlertGateway.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'critical',
                    source: 'incident-webhook',
                    title: expect.stringContaining('INCIDENT MANUEL'),
                }),
            );
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🤖 AUTO-REMÉDIATION
    // ══════════════════════════════════════════════════════════════════════════

    describe('Auto-remédiation', () => {
        it.each([
            'dlq.event.stuck',
            'signup.email.failed',
            'session.expired',
        ])('auto-remédie %s (low risk, sans backup)', async (alertType) => {
            const res = await POST(
                buildReq(
                    { alertType, severity: 'warning', tenant: 't1' },
                    'test-secret',
                ) as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(200);
            const body = (await res.json()) as { action: string };
            expect(body.action).toBe('auto_remediated');
            // Alerte "info" envoyée pour tracer la remédiation
            expect(OpsAlertGateway.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'info',
                    title: expect.stringContaining('Auto-remediation'),
                }),
            );
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 📞 DÉFAUT : notify oncall
    // ══════════════════════════════════════════════════════════════════════════

    describe('Notification par défaut', () => {
        it('sur alerte inconnue → notify_oncall avec la severity reçue', async () => {
            const res = await POST(
                buildReq(
                    {
                        alertType: 'custom.unknown.alert',
                        severity: 'warning',
                        tenant: 't1',
                        message: 'quelque chose cloche',
                    },
                    'test-secret',
                ) as unknown as Parameters<typeof POST>[0],
            );
            expect(res.status).toBe(200);
            const body = (await res.json()) as { action: string; severity: string };
            expect(body.action).toBe('notified_oncall');
            expect(body.severity).toBe('warning');
            expect(OpsAlertGateway.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warning',
                    source: 'incident-webhook',
                    title: expect.stringContaining('custom.unknown.alert'),
                }),
            );
        });
    });
});
