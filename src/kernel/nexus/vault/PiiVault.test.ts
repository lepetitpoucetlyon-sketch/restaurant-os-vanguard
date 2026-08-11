import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PiiVault } from './PiiVault';
import { Nexus } from '@/lib/nexus/NexusAdapter';

let store: Record<string, unknown> = {};

describe('PiiVault', () => {
    let vault: PiiVault;

    beforeEach(() => {
        vault = new PiiVault();
        store = {};
        vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => (store[path] as unknown) ?? null);
        vi.spyOn(Nexus.adapter, 'set').mockImplementation(async (path: string, data: unknown) => { store[path] = data; });
    });

    it('stores and retrieves PII fields', async () => {
        await vault.store('resto-1', 'subject-42', {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@example.com',
        });

        const result = await vault.retrieve('resto-1', 'subject-42');
        expect(result).toEqual({
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@example.com',
        });
    });

    it('returns null for unknown subject', async () => {
        const result = await vault.retrieve('resto-1', 'unknown');
        expect(result).toBeNull();
    });

    it('erases PII by clearing payload', async () => {
        await vault.store('resto-1', 'subject-99', {
            firstName: 'Marie',
            phone: '+33600000000',
        });

        const erased = await vault.erase('resto-1', 'subject-99');
        expect(erased).toBe(true);

        const record = store['tenants/resto-1/piiVault/subject-99'] as { keyFingerprint: string; encryptedPayload: string };
        expect(record.keyFingerprint).toBe('ERASED');
        expect(record.encryptedPayload).toBe('');
    });

    it('erase returns false for unknown subject', async () => {
        const result = await vault.erase('resto-1', 'ghost');
        expect(result).toBe(false);
    });
});
