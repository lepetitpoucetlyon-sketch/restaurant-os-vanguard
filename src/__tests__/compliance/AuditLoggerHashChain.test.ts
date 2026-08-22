/**
 * AuditLogger — Tests hash chain SHA-256 + export forensique (ADR-014 chantier 3).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('AuditLogger — hash chain SHA-256', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        Nexus.adapter = new MockAdapter();
        await Nexus.adapter.set('mcc/audit_chain/head', { lastHash: 'GENESIS', lastId: null, count: 0, updatedAt: 0 });
    });

    it('logAction() écrit un log avec hash + previousHash + met à jour head', async () => {
        const log = await AuditLogger.logAction('admin_1', 'KILL_SWITCH_ACTIVATE', 'tenant_x');

        expect(log).not.toBeNull();
        expect(log!.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(log!.previousHash).toBe('GENESIS');

        const head = (await Nexus.adapter.get('mcc/audit_chain/head')) as { lastHash: string; count: number };
        expect(head.lastHash).toBe(log!.hash);
        expect(head.count).toBe(1);
    });

    it('chaîne : log N+1 a previousHash === hash du log N', async () => {
        const l1 = await AuditLogger.logAction('a', 'MFA_ENABLED', 'user_1');
        const l2 = await AuditLogger.logAction('a', 'ROLE_ELEVATED', 'user_2');
        const l3 = await AuditLogger.logAction('a', 'TENANT_PROVISIONED', 'tenant_y');

        expect(l2!.previousHash).toBe(l1!.hash);
        expect(l3!.previousHash).toBe(l2!.hash);
    });

    it('verifyChain() détecte une falsification (metadata modifiée)', async () => {
        const l1 = await AuditLogger.logAction('a', 'MFA_ENABLED', 'u1', { ip: '1.2.3.4' });
        const l2 = await AuditLogger.logAction('a', 'ROLE_ELEVATED', 'u2');

        // Tampering : modifier metadata de l1 sans recalculer le hash
        const tampered = { ...l1!, metadata: { ip: 'HACKER' } };

        const { valid, breaks } = await AuditLogger.verifyChain([tampered, l2!]);
        expect(valid).toBe(false);
        expect(breaks.length).toBeGreaterThan(0);
    });

    it('verifyChain() détecte une rupture de chaîne (log inséré)', async () => {
        const l1 = await AuditLogger.logAction('a', 'MFA_ENABLED', 'u1');
        const l2 = await AuditLogger.logAction('a', 'ROLE_ELEVATED', 'u2');

        // Fake log inséré entre l1 et l2 avec previousHash truqué
        const fake: typeof l1 = {
            ...l1!,
            id: 'fake_id',
            timestamp: (l1!.timestamp + l2!.timestamp) / 2,
            previousHash: 'FAKE_PREV_HASH',
            hash: 'FAKE_HASH',
        };

        const { valid, breaks } = await AuditLogger.verifyChain([l1!, fake, l2!]);
        expect(valid).toBe(false);
        expect(breaks.some(b => b.id === 'fake_id')).toBe(true);
    });

    it('exportChain() filtre par période + retourne finalHash + intégrité', async () => {
        const before = Date.now();
        await AuditLogger.logAction('a', 'MFA_ENABLED', 'u1');
        await AuditLogger.logAction('a', 'ROLE_ELEVATED', 'u2');
        await AuditLogger.logAction('a', 'TENANT_PROVISIONED', 'tenant_y');
        const after = Date.now();

        const bundle = await AuditLogger.exportChain(before - 100, after + 100);
        expect(bundle.count).toBe(3);
        expect(bundle.finalHash).toMatch(/^[a-f0-9]{64}$/);
        expect(bundle.integrityValid).toBe(true);
        expect(bundle.breaks).toEqual([]);
        expect(bundle.logs.length).toBe(3);
    });

    it('exportChain() vide si aucun log dans la période', async () => {
        await AuditLogger.logAction('a', 'MFA_ENABLED', 'u1');

        const bundle = await AuditLogger.exportChain(0, 100); // très ancien
        expect(bundle.count).toBe(0);
        expect(bundle.finalHash).toBe('GENESIS');
        expect(bundle.integrityValid).toBe(true);
    });

    it('supporte les 30+ AuditAction types étendus', async () => {
        const actions = [
            'ALLERGEN_ORDER_BLOCKED',
            'HACCP_ALERT_RAISED',
            'CHILLING_NONCONFORM',
            'RECALL_BROADCAST',
            'FEC_EXPORTED',
            'DGFIP_INSPECTION_MODE',
            'CROSS_SCOPE_GRANT',
            'RGPD_PURGE_REQUESTED',
        ] as const;
        for (const action of actions) {
            const log = await AuditLogger.logAction('admin', action, 'target');
            expect(log?.action).toBe(action);
        }
        const head = (await Nexus.adapter.get('mcc/audit_chain/head')) as { count: number };
        expect(head.count).toBe(actions.length);
    });
});
