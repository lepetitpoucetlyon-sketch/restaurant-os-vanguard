import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

describe('OpsAlertGateway', () => {
    const originalEnv = { ...process.env };
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.OPS_ALERT_WEBHOOK_URL;
        delete process.env.OPS_ALERT_WEBHOOK_KIND;
        delete process.env.OPS_ALERT_MIN_SEVERITY;
    });

    afterEach(() => {
        process.env = originalEnv;
        globalThis.fetch = originalFetch;
    });

    it('renvoie false et ne throw pas si aucun webhook configuré', async () => {
        const result = await OpsAlertGateway.send({
            title: 'test',
            message: 'no webhook',
            severity: 'critical',
            source: 'unit-test',
        });
        expect(result).toBe(false);
    });

    it('envoie une charge Slack sur URL hooks.slack.com', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://hooks.slack.com/services/T/B/xxx';
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const ok = await OpsAlertGateway.send({
            title: 'DLQ quarantine — order.sealed',
            message: 'Event stuck',
            severity: 'critical',
            source: 'dlq-quarantine',
            context: { attempts: 5 },
        });

        expect(ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, opts] = fetchMock.mock.calls[0];
        const body = JSON.parse(opts.body);
        expect(body).toHaveProperty('text');
        expect(body.text).toContain('[CRITICAL]');
        expect(body.text).toContain('DLQ quarantine');
    });

    it('envoie une charge Discord sur URL discord', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1/xxx';
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await OpsAlertGateway.send({
            title: 't',
            message: 'm',
            severity: 'warning',
            source: 'x',
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toHaveProperty('content');
        expect(body).not.toHaveProperty('text');
    });

    it('envoie une charge JSON générique sur webhook inconnu', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://ops.example.com/hook';
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await OpsAlertGateway.send({
            title: 'x',
            message: 'y',
            severity: 'critical',
            source: 'z',
            context: { foo: 'bar' },
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toMatchObject({
            title: 'x',
            severity: 'critical',
            source: 'z',
            message: 'y',
            context: { foo: 'bar' },
        });
        expect(body.timestamp).toEqual(expect.any(String));
    });

    it('drop les alertes sous OPS_ALERT_MIN_SEVERITY', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://ops.example.com/hook';
        process.env.OPS_ALERT_MIN_SEVERITY = 'critical';
        const fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const ok = await OpsAlertGateway.send({
            title: 't',
            message: 'm',
            severity: 'warning',
            source: 'x',
        });
        expect(ok).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ne throw jamais si le webhook renvoie 500', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://ops.example.com/hook';
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

        const ok = await OpsAlertGateway.send({
            title: 't',
            message: 'm',
            severity: 'critical',
            source: 'x',
        });
        expect(ok).toBe(false);
    });

    it('ne throw jamais si fetch rejette', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://ops.example.com/hook';
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('econnrefused')) as unknown as typeof fetch;

        const ok = await OpsAlertGateway.send({
            title: 't',
            message: 'm',
            severity: 'critical',
            source: 'x',
        });
        expect(ok).toBe(false);
    });

    it('respecte OPS_ALERT_WEBHOOK_KIND override', async () => {
        process.env.OPS_ALERT_WEBHOOK_URL = 'https://hooks.slack.com/services/T/B/xxx';
        process.env.OPS_ALERT_WEBHOOK_KIND = 'generic';
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await OpsAlertGateway.send({
            title: 't',
            message: 'm',
            severity: 'critical',
            source: 'x',
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toHaveProperty('title'); // format générique, pas Slack
        expect(body).not.toHaveProperty('text');
    });
});
