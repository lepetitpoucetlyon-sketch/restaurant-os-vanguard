import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/compliance/fiscal-archive-export/route';
import { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import * as adminAuthGuard from '@/lib/server/adminAuthGuard';

describe('API /api/admin/compliance/fiscal-archive-export', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devrait retourner l archive fiscale scellée avec le master hash SHA-256', async () => {
        vi.spyOn(adminAuthGuard, 'requireMccLevel').mockResolvedValue({
            uid: 'admin_fleet_01',
            role: 'super_admin',
        } as never);

        vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string) => {
            if (path.includes('journalEntries')) {
                return [
                    { id: 'JE-001', date: '2026-08-01', debit: 50, credit: 50, reference: 'TICKET-01' }
                ];
            }
            if (path.includes('fiscalSeals')) {
                return [
                    { id: 'GENESIS', type: 'GENESIS', hash: 'hash_genesis_123', timestamp: '2026-08-01T00:00:00Z', tenantId: 'tenant_sample' }
                ];
            }
            return [];
        });

        vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({
            siret: '12345678900012',
            metadata: { name: 'Restaurant du Parc' }
        });

        const req = new NextRequest('http://localhost:3000/api/admin/compliance/fiscal-archive-export', {
            method: 'POST',
            body: JSON.stringify({ tenantId: 'tenant_sample' }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.archive.metadata.certification).toContain('NF525');
        expect(data.archive.metadata.masterArchiveHash).toBeDefined();
        expect(data.archive.journalEntries).toHaveLength(1);
        expect(data.archive.fiscalSeals).toHaveLength(1);
    });

    it('devrait rejeter si le tenantId est manquant', async () => {
        vi.spyOn(adminAuthGuard, 'requireMccLevel').mockResolvedValue({
            uid: 'admin_fleet_01',
            role: 'super_admin',
        } as never);

        const req = new NextRequest('http://localhost:3000/api/admin/compliance/fiscal-archive-export', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
