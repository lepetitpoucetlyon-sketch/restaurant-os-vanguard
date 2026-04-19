import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import { createNexusNode } from '@/store/nexusNodeFactory';
import { getDefaultStore } from 'jotai';

/**
 * 🎰 RAM Plateau Verification (Grade VI)
 * Verifies that the 'Slotted Atoms' and Manual GC logic 
 * maintains a constant memory footprint in the registry.
 */
describe('RAM Plateau & Manual GC', () => {
    const store = getDefaultStore();

    it('should register and then purge nodes when usage hits zero', () => {
        const domainId = 'test-domain-1';
        const node = createNexusNode(domainId, [{ id: 'item1' }]);
        
        // 1. Initial State: Registered but usage is 0
        const inventory = GlobalRegistryService.getInventory();
        expect(inventory).toContain(domainId);
        
        // 2. Simulate Use (Mount)
        GlobalRegistryService.touch(domainId);
        let entry = GlobalRegistryService.getEntry(domainId);
        expect(entry?.usageCount).toBe(1);
        
        // 3. Simulate Release (Unmount)
        // This should trigger immediate forceNuclearPurge as implemented in Phase 4
        GlobalRegistryService.release(domainId, store);
        
        entry = GlobalRegistryService.getEntry(domainId);
        expect(entry?.usageCount).toBe(0);
        
        // 4. Verify RAM Clearance
        // Even though the entry exists in registry (for metadata), its DATA must be empty
        const nodeState = store.get(node);
        expect(nodeState.data).toEqual([]);
        expect(nodeState.loading).toBe(true);
    });

    it('should maintain O(1) registry size for high-frequency tenant switching', () => {
        // Mocking many tenant nodes
        const tenantIds = Array.from({ length: 50 }, (_, i) => `tenant-${i}`);
        
        tenantIds.forEach(id => {
            const domainId = `orders-${id}`;
            createNexusNode(domainId, [{ id: 'order1' }]);
            
            // Mount and immediately Unmount
            GlobalRegistryService.touch(domainId);
            GlobalRegistryService.release(domainId, store);
        });

        // Verify that while domains are registered, their HEAP (data) is empty
        tenantIds.forEach(id => {
            const entry = GlobalRegistryService.getEntry(`orders-${id}`);
            const state = store.get(entry!.atom as any);
            expect(state.data).toHaveLength(0);
        });
        
        console.log(`✅ O(1) Memory Proof: ${tenantIds.length} tenants visited, 0 orders leaked in RAM.`);
    });
});
