import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebPushService } from './webPushService';
const mockSendNotification = vi.fn().mockResolvedValue({});
const mockSetVapidDetails = vi.fn();

vi.mock('web-push', () => ({
    default: {
        sendNotification: (...args: unknown[]) => mockSendNotification(...args),
        setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
    },
}));

const mockGet = vi.fn();
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn();

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: (...args: unknown[]) => mockGet(...args),
            set: (...args: unknown[]) => mockSet(...args),
            query: (...args: unknown[]) => mockQuery(...args),
        },
    },
}));

describe('WebPushService', () => {
    beforeEach(() => {
        mockSendNotification.mockClear();
        mockSetVapidDetails.mockClear();
        mockGet.mockReset();
        mockSet.mockReset().mockResolvedValue(undefined);
        mockQuery.mockReset();
    });

    it('saveSubscription stores in multi-tenant path', async () => {

        const fakeSub = { endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'x', auth: 'y' } };

        await WebPushService.saveSubscription('resto-1', 'user-42', fakeSub as unknown as PushSubscription);

        expect(mockSet).toHaveBeenCalledWith(
            'tenants/resto-1/pushSubscriptions/user-42',
            expect.objectContaining({ userId: 'user-42' })
        );
    });

    it('sendToUser skips silently without VAPID keys', async () => {
        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;


        await WebPushService.sendToUser('resto-1', 'user-42', { title: 'Test', body: 'Hello' });

        expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('sendToUser sends notification with VAPID keys configured', async () => {
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BPublicKey123';
        process.env.VAPID_PRIVATE_KEY = 'privateKey456';

        const fakeSub = { endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'x', auth: 'y' } };
        mockGet.mockResolvedValue({
            userId: 'user-42',
            subscription: JSON.stringify(fakeSub),
            updatedAt: Date.now(),
        });


        await WebPushService.sendToUser('resto-1', 'user-42', { title: 'Alerte', body: 'Temp hors seuil' });

        expect(mockGet).toHaveBeenCalledWith('tenants/resto-1/pushSubscriptions/user-42');
        expect(mockSetVapidDetails).toHaveBeenCalledWith(
            'mailto:contact@restaurant-os.app',
            'BPublicKey123',
            'privateKey456'
        );
        expect(mockSendNotification).toHaveBeenCalledWith(
            fakeSub,
            JSON.stringify({ title: 'Alerte', body: 'Temp hors seuil' })
        );

        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;
    });

    it('sendToRole queries tenant-scoped users', async () => {
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BPublicKey123';
        process.env.VAPID_PRIVATE_KEY = 'privateKey456';

        mockQuery.mockResolvedValue([
            { id: 'user-1', role: 'chef_cuisinier' },
            { id: 'user-2', role: 'chef_cuisinier' },
        ]);
        mockGet.mockResolvedValue(null);


        await WebPushService.sendToRole('resto-1', 'chef_cuisinier', { title: 'Alerte', body: 'Test' });

        expect(mockQuery).toHaveBeenCalledWith(
            'tenants/resto-1/users',
            expect.objectContaining({ where: [{ field: 'role', operator: '==', value: 'chef_cuisinier' }] })
        );

        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;
    });
});
