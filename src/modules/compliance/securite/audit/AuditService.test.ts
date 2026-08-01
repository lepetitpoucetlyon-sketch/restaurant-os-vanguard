import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from './AuditService';
import { operationalFlags } from '@/config/features';

function createMockNexus() {
    const store: Record<string, unknown> = {};
    let idCounter = 0;
    return {
        store,
        set: vi.fn(async (path: string, data: unknown) => { store[path] = data; }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: vi.fn(async (): Promise<any[]> => []),
        generateId: vi.fn(() => `audit-${++idCounter}`),
    };
}

describe('AuditService', () => {
    let service: AuditService;
    let nexus: ReturnType<typeof createMockNexus>;

    beforeEach(() => {
        service = new AuditService();
        nexus = createMockNexus();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service.setNexus(nexus as any);
        (operationalFlags as unknown as Record<string, string>).auditIntercept = 'enforce';
    });

    it('records an audit event with hash chain', async () => {
        const event = await service.record({
            tenantId: 'resto-1',
            actorId: 'user-42',
            actorRole: 'manager',
            action: 'update',
            collection: 'settings',
            entityId: 'global',
        });

        expect(event).not.toBeNull();
        expect(event!.hash).toBeTruthy();
        expect(event!.previousHash).toBe('AUDIT_GENESIS_0000000000000000');
        expect(nexus.set).toHaveBeenCalledOnce();
    });

    it('chains hashes across events', async () => {
        const first = await service.record({
            tenantId: 'resto-1',
            actorId: 'user-1',
            actorRole: 'directeur',
            action: 'create',
            collection: 'staff',
            entityId: 'emp-1',
        });

        const second = await service.record({
            tenantId: 'resto-1',
            actorId: 'user-1',
            actorRole: 'directeur',
            action: 'update',
            collection: 'staff',
            entityId: 'emp-1',
        });

        expect(second!.previousHash).toBe(first!.hash);
        expect(second!.hash).not.toBe(first!.hash);
    });

    it('strips PII from before/after payloads', async () => {
        const event = await service.record({
            tenantId: 'resto-1',
            actorId: 'user-1',
            actorRole: 'manager',
            action: 'update',
            collection: 'staff',
            entityId: 'emp-1',
            before: { email: 'old@example.com', role: 'serveur' },
            after: { email: 'new@example.com', role: 'chef_rang', phone: '+33612345678' },
        });

        expect(event!.before!['email']).toBe('[REDACTED]');
        expect(event!.before!['role']).toBe('serveur');
        expect(event!.after!['email']).toBe('[REDACTED]');
        expect(event!.after!['phone']).toBe('[REDACTED]');
        expect(event!.after!['role']).toBe('chef_rang');
    });

    it('identifies audited collections', () => {
        expect(service.isAuditedCollection('journalEntries')).toBe(true);
        expect(service.isAuditedCollection('staff')).toBe(true);
        expect(service.isAuditedCollection('randomCollection')).toBe(false);
    });

    it('resumes chain from last stored event on init', async () => {
        const fakeLastHash = 'abc123deadbeef';
        nexus.query.mockResolvedValueOnce([{ hash: fakeLastHash }]);

        await service.init('resto-1');

        const event = await service.record({
            tenantId: 'resto-1',
            actorId: 'user-1',
            actorRole: 'manager',
            action: 'create',
            collection: 'orders',
        });

        expect(event!.previousHash).toBe(fakeLastHash);
    });

    it('returns null without nexus writer', async () => {
        const noNexusService = new AuditService();
        const event = await noNexusService.record({
            tenantId: 'resto-1',
            actorId: 'user-1',
            actorRole: 'manager',
            action: 'create',
            collection: 'orders',
        });
        expect(event).toBeNull();
    });
});
