import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireSession } from '@/lib/server/verifySession';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import * as nextHeaders from 'next/headers';

vi.mock('@/lib/auth/ServerAuthProvider', () => ({
    getServerAuthProvider: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: vi.fn(),
}));

describe('test', () => {
    it('debug', async () => {
        const mockVerifyIdToken = vi.fn();
        (getServerAuthProvider as any).mockReturnValue({ verifyIdToken: mockVerifyIdToken });
        (nextHeaders.headers as any).mockResolvedValue({ get: () => 'Bearer valid-token' });
        mockVerifyIdToken.mockResolvedValue({ uid: 'user-1', tenantId: 'tenant-456' });
        
        try {
            await requireSession('tenant-123');
        } catch (e: any) {
            console.log(e.message);
        }
    });
});
