import { describe, it, vi } from 'vitest';
import { requireSession, verifySession } from '@/lib/server/verifySession';

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
    it('debug', async () => {
        const decoded = await verifySession();
        console.log('decoded from verifySession:', decoded);
        try {
            await requireSession('tenant-123');
        } catch (e: any) {
            console.log('error from requireSession:', e.message);
        }
    });
});
