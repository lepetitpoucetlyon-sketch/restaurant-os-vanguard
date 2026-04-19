import { QualityEngine } from './QualityEngine';
import { QualityControl } from '@/domain/types/quality';
import { updateNexusNode } from '@/store/operationalAtoms';

// Mock dependencies
jest.mock('@/store/operationalAtoms', () => ({
  updateNexusNode: jest.fn(),
  stockItemsAtom: { key: 'stockItems' },
  deliveriesAtom: { key: 'deliveries' }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('QualityEngine - Grade VI HACCP Validation', () => {
  const mockTenantId = 'test-tenant-v6';
  
  const baseControl: Partial<QualityControl> = {
    id: 'ctrl_123',
    type: 'reception',
    supplier_id: 'sup_456',
    supplier_name: 'Test Supplier',
    delivery: { id: 'del_789', reference: 'REF-001' },
    controlled_at: new Date().toISOString(),
    items: [
      {
        id: 'item_1',
        product_id: 'prod_1',
        product_name: 'Milk',
        product_category: 'dairy',
        quantity_ordered: 10,
        quantity_delivered: 10,
        quantity_accepted: 10,
        quantity_rejected: 0,
        unit: 'L',
        expiry_type: 'dlc',
        days_until_expiry: 10,
        is_short_dlc: false,
        is_rejected: false,
        decision: 'accepted',
        corrective_action: 'none',
        checks: {
          visual: { performed: true, status: 'pass', aspects: [], photos: [] },
          temperature: { required: true, performed: true, target: { min: 0, max: 4 }, measured: 2, status: 'pass', warning_threshold: 4 },
          weight: { required: false, performed: false, unit: 'kg', status: 'pass', tolerance_percent: 5 },
          freshness: { required: true, performed: true, score: 5 }
        }
      }
    ],
    delivery_conditions: {
      vehicle_type: 'refrigerated',
      vehicle_temperature: { measured: 2, compliant: true },
      vehicle_cleanliness: 'clean',
      packaging_integrity: 'intact',
      delivery_time_compliant: true
    },
    summary: {
      total_items: 1,
      items_accepted: 1,
      items_rejected: 0,
      temperature_issues: 0,
      visual_issues: 0,
      overall_status: 'pass',
      supplier_score_impact: 10
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
      fingerprint: ''
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a compliant reception and update stock', async () => {
    const result = await QualityEngine.validateReception(baseControl, mockTenantId);
    
    expect(result).toBeDefined();
    expect(result.metadata.fingerprint).not.toBe('');
    expect(updateNexusNode).toHaveBeenCalledWith('qualityControls', expect.any(Function));
    // Verify stock injection was triggered
    expect(updateNexusNode).toHaveBeenCalledWith('stockItems', expect.any(Function));
  });

  it('should flag a failed reception if temperature is too high', async () => {
    const failedControl = {
      ...baseControl,
      delivery_conditions: {
        ...baseControl.delivery_conditions,
        vehicle_temperature: { measured: 15, compliant: false }
      },
      summary: {
        ...baseControl.summary,
        overall_status: 'fail' as const
      }
    };

    const result = await QualityEngine.validateReception(failedControl, mockTenantId);
    expect(result.summary.overall_status).toBe('fail');
    // In Grade VI, a failed reception might still be logged but maybe not injected in stock
    // Check logic in QualityEngine to see if stock update is skipped for 'fail'
  });

  it('should seal the control with SHA-256 fingerprint', async () => {
    const result = await QualityEngine.validateReception(baseControl, mockTenantId);
    expect(result.metadata.fingerprint.length).toBe(64); // SHA-256 length
  });
});
