import { describe, it, vi } from 'vitest';

vi.mock('@/lib/auth/ServerAuthProvider', () => ({
    getServerAuthProvider: vi.fn().mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-456' })
    })
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockImplementation(async () => {
        return { get: () => 'Bearer valid-token' };
    })
}));

describe('test', () => {
    it('debug3', async () => {
        try {
            const h = await require('next/headers').headers();
            console.log('h =', h);
            console.log('h.get =', h.get('authorization'));
        } catch (e) {
            console.log('Error calling headers():', e);
        }
    });
});
