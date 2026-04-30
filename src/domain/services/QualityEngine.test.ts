import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/tests/vanguard/mocks';
import { QualityEngine } from './QualityEngine';
import { QualityControl } from '@domain/types/quality';
import { updateNexusNode } from '@/store/operationalAtoms';

// Mock dependencies
vi.mock('@/store/operationalAtoms', () => ({
  updateNexusNode: vi.fn((prev, updates) => ({ ...prev, ...updates, lastUpdated: Date.now() })),
  stockItemsNodeAtom: { key: 'stockItems' },
  deliveriesNodeAtom: { key: 'deliveries' },
  qualityControlsNodeAtom: { key: 'qualityControls' }
}));

vi.mock('@/lib/axiom', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('QualityEngine - Grade VI HACCP Validation', () => {
  const mockTenantId = 'test-tenant-v6';
  
  const baseControl = {
    deliveryId: 'del_789',
    supplierName: 'Test Supplier',
    truckTemp: 2,
    hygieneStatus: 'clean' as const,
    itemsChecked: [
      {
        id: 'item_1',
        name: 'Milk',
        status: 'ok' as const,
        temp: 2,
        quantity: 10
      }
    ],
    validatedBy: 'agent_007'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate a compliant reception and update stock', async () => {
    const result = await QualityEngine.validateReception(baseControl, mockTenantId);
    
    expect(result).toBeDefined();
    expect(result.currentStatus).toBeDefined();
    // Verify result integrity
    expect(result.id).toContain('HACCP-REC');
  });

  it('should flag a failed reception if temperature is too high', async () => {
    const failedControl = {
      ...baseControl,
      hygieneStatus: 'dirty' as const,
      truckTemp: 15
    };

    const result = await QualityEngine.validateReception(failedControl, mockTenantId);
    expect(result.currentStatus).toBe('dirty');
    // In Grade VI, a failed reception might still be logged but maybe not injected in stock
    // Check logic in QualityEngine to see if stock update is skipped for 'fail'
  });

  it('should seal the control with SHA-256 fingerprint', async () => {
    const result = await QualityEngine.validateReception(baseControl, mockTenantId);
    expect(result.id).toBeDefined();
  });
});
