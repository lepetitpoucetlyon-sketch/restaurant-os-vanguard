import { describe, it, expect, vi } from 'vitest';
import { GeminiLiveService } from '@/modules/intelligence/ia/GeminiAdapter';
import { AGENT_TOOLS } from '@/modules/intelligence';
import { User } from '@nexus/contracts';

// Mock Dependencies
vi.mock('@/lib/firebase', () => ({
    firebaseApp: {},
    getFunctions: vi.fn(),
    httpsCallable: vi.fn()
}));

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            batch: vi.fn(),
            query: vi.fn(),
            update: vi.fn(),
            set: vi.fn()
        }
    }
}));

describe('🧠 PACTE NÉVRALGIQUE : TEST ANTI-HALLUCINATION', () => {
    
    const mockUser: User = { id: 'user_123', role: 'admin', name: 'Majordome' } as any;
    const mockPermissions: any = { inventory: true, finance: true };

    it('P01: Rejet d\'une commande avec arguments manquants (Hallucination)', async () => {
        const service = new GeminiLiveService(mockUser, mockPermissions);
        const sendToolResultSpy = vi.spyOn(service as any, 'sendToolResult');

        // Simulate a tool call with missing tenantId
        await (service as any).handleToolCall({
            name: 'check_low_stock',
            args: {}, // Missing tenantId
            callId: 'call_abc'
        });

        expect(sendToolResultSpy).toHaveBeenCalledWith('call_abc', expect.objectContaining({
            error: expect.stringContaining("tenantId")
        }));
    });

    it('P02: Rejet d\'un type invalide (Hallucination de type)', async () => {
        const service = new GeminiLiveService(mockUser, mockPermissions);
        const sendToolResultSpy = vi.spyOn(service as any, 'sendToolResult');

        // Simulate a tool call with numeric tenantId (string expected)
        await (service as any).handleToolCall({
            name: 'check_low_stock',
            args: { tenantId: 123 }, // Wrong type
            callId: 'call_def'
        });

        expect(sendToolResultSpy).toHaveBeenCalledWith('call_def', expect.objectContaining({
            error: expect.stringContaining("tenantId:")
        }));
    });

    it('P03: Validation d\'une commande légitime', async () => {
        const service = new GeminiLiveService(mockUser, mockPermissions);
        const sendToolResultSpy = vi.spyOn(service as any, 'sendToolResult');
        
        // Mock tool execution result
        const stockToolSpy = vi.spyOn(AGENT_TOOLS['check_low_stock'], 'execute').mockResolvedValue({ 
            items: [] 
        } as any);

        await (service as any).handleToolCall({
            name: 'check_low_stock',
            args: { tenantId: 'T1' },
            callId: 'call_ghi'
        });

        expect(stockToolSpy).toHaveBeenCalled();
        expect(sendToolResultSpy).toHaveBeenCalledWith('call_ghi', expect.objectContaining({
            items: []
        }));
    });
});
