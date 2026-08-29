import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as runChainAuditEndpoint } from '@/app/api/admin/compliance/chain-audit/route';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import * as adminAuth from '@/lib/server/adminAuthGuard';

describe('⚖️ Lot 3 — Audit de Chaîne Fiscale NF525 (/api/admin/compliance/chain-audit)', () => {
    const tenantId = 'tenant_test_fiscal';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(adminAuth, 'requireMccLevel').mockResolvedValue({
            uid: 'mcc_tester',
            role: 'mcc_super_admin',
        });
    });

    it('retourne BREACH si la chaîne est altérée ou rompue', async () => {
        const snap1 = JSON.stringify({ total: 5000 });
        const hash1 = await CryptoService.generateHash(snap1, 'GENESIS');

        const snap2 = JSON.stringify({ total: 7500 });
        // Simule un hash forgé / altéré
        const forgedHash = 'tampered_hash_12345';

        vi.spyOn(Nexus.adapter, 'query').mockResolvedValueOnce([
            { id: 'seal_1', hash: hash1, previousHash: 'GENESIS', dataSnapshot: snap1, timestamp: '2026-08-29T10:00:00Z' },
            { id: 'seal_2', hash: forgedHash, previousHash: hash1, dataSnapshot: snap2, timestamp: '2026-08-29T10:05:00Z' },
        ] as any);

        const req = new NextRequest(`http://localhost:3000/api/admin/compliance/chain-audit?tenantId=${tenantId}`);

        const res = await runChainAuditEndpoint(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.integrity).toBe('BREACH');
        expect(data.breaches.length).toBeGreaterThan(0);
        expect(data.breaches[0].sealId).toBe('seal_2');
    });

    it('retourne OK sur une chaîne de scellement intègre', async () => {
        const snap1 = JSON.stringify({ total: 5000 });
        const hash1 = await CryptoService.generateHash(snap1, 'GENESIS');

        const snap2 = JSON.stringify({ total: 7500 });
        const hash2 = await CryptoService.generateHash(snap2, hash1);

        vi.spyOn(Nexus.adapter, 'query').mockResolvedValueOnce([
            { id: 'seal_1', hash: hash1, previousHash: 'GENESIS', dataSnapshot: snap1, timestamp: '2026-08-29T10:00:00Z' },
            { id: 'seal_2', hash: hash2, previousHash: hash1, dataSnapshot: snap2, timestamp: '2026-08-29T10:05:00Z' },
        ] as any);

        const req = new NextRequest(`http://localhost:3000/api/admin/compliance/chain-audit?tenantId=${tenantId}`);

        const res = await runChainAuditEndpoint(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.integrity).toBe('OK');
        expect(data.validEntries).toBe(2);
        expect(data.breaches.length).toBe(0);
    });
});
