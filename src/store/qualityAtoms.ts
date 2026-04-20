import { atom } from 'jotai';
import { createNexusNode, updateNexusNode } from './operationalAtoms';
import { QualityControl, ProductQualityConfig, SupplierQualityScore } from '@/domain/types/quality';

/**
 * ⚛️ Quality Module Atoms - Grade VI
 * Managed by Nexus-Darwin-5 Protocol
 */

// --- 🏛️ STATIC GRADE VI BOOTSTRAP DATA ---
const INITIAL_CONTROLS: QualityControl[] = [
    {
        id: 'QC-20260416-A23F',
        control_number: 'QC-26-001',
        type: 'reception',
        supplier_id: 'sup_prime',
        supplier_name: 'Prime Legumes & Co',
        controlled_at: new Date(Date.now() - 3600000).toISOString(),
        controlled_by: 'system',
        controller_name: 'Mohammed-ali',
        delivery_conditions: {
            vehicle_type: 'refrigerated',
            vehicle_temperature: { compliant: true, measured: 3.2 },
            vehicle_cleanliness: 'clean',
            packaging_integrity: 'intact',
            delivery_time_compliant: true
        },
        items: [],
        summary: {
            total_items: 12,
            items_accepted: 12,
            items_rejected: 0,
            temperature_issues: 0,
            visual_issues: 0,
            overall_status: 'pass',
            supplier_score_impact: 2
        },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: true,
            fingerprint: 'sha256-mock-perfect'
        }
    },
    {
        id: 'QC-20260416-B55X',
        control_number: 'QC-26-002',
        type: 'reception',
        supplier_id: 'sup_meat',
        supplier_name: 'Boucherie Centrale',
        controlled_at: new Date(Date.now() - 7200000).toISOString(),
        controlled_by: 'system',
        controller_name: 'Mohammed-ali',
        delivery_conditions: {
            vehicle_type: 'refrigerated',
            vehicle_temperature: { compliant: false, measured: 8.5 },
            vehicle_cleanliness: 'acceptable',
            packaging_integrity: 'damaged',
            delivery_time_compliant: true
        },
        items: [],
        summary: {
            total_items: 5,
            items_accepted: 2,
            items_rejected: 3,
            temperature_issues: 1,
            visual_issues: 1,
            overall_status: 'fail',
            supplier_score_impact: -15
        },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: true,
            fingerprint: 'sha256-mock-alert'
        }
    }
];

const INITIAL_SCORES: SupplierQualityScore[] = [
    { supplierId: 'sup_prime', supplierName: 'Prime Legumes & Co', month: '2026-04', reliabilityScore: 98, complianceRate: 100, rejectionRate: 0, averageTempDrift: 0.2, incidentsCount: 0 },
    { supplierId: 'sup_dairy', supplierName: 'Laiterie du Nord', month: '2026-04', reliabilityScore: 94, complianceRate: 98, rejectionRate: 2, averageTempDrift: 0.5, incidentsCount: 1 },
    { supplierId: 'sup_meat', supplierName: 'Boucherie Centrale', month: '2026-04', reliabilityScore: 82, complianceRate: 85, rejectionRate: 15, averageTempDrift: 2.1, incidentsCount: 4 }
];

// 1. Quality Controls History (NexusNode managed)
export const qualityControlsNodeAtom = createNexusNode<QualityControl>('qualityControls');
export const qualityControlsAtom = atom((get) => {
    const data = get(qualityControlsNodeAtom).data;
    return data.length > 0 ? data : INITIAL_CONTROLS;
});
export const qualityLoadingAtom = atom((get) => get(qualityControlsNodeAtom).loading);

// 2. Active Session Store (Current Reception)
export const qualityActiveControlAtom = atom<Partial<QualityControl>>({
    items: [],
    delivery_conditions: {
        vehicle_type: 'unknown',
        vehicle_temperature: { compliant: true, measured: 0 },
        vehicle_cleanliness: 'not_checked',
        packaging_integrity: 'intact',
        delivery_time_compliant: true
    }
});

export const qualityControlStepAtom = atom<1 | 2 | 3>(1);
export const qualitySelectedDeliveryIdAtom = atom<string | null>(null);

// 3. Product-Specific Quality Configs
export const productQualityConfigsNodeAtom = createNexusNode<ProductQualityConfig>('productQualityConfigs');
export const productQualityConfigsAtom = atom((get) => get(productQualityConfigsNodeAtom).data);

// 4. Supplier performance ranking
export const supplierScoresNodeAtom = createNexusNode<SupplierQualityScore>('supplierQualityScores');
export const supplierScoresAtom = atom((get) => {
    const data = get(supplierScoresNodeAtom).data;
    return data.length > 0 ? data : INITIAL_SCORES;
});

// 5. Statistics & Alert Selectors
export const qualityAlertsAtom = atom((get) => {
    const controls = get(qualityControlsAtom);
    return controls.filter(c => c.summary.overall_status === 'fail' || c.summary.overall_status === 'warning');
});

// Selector for today's reception performance
export const todayReceptionStatsAtom = atom((get) => {
    const controls = get(qualityControlsAtom);
    const today = new Date().toISOString().split('T')[0];
    const todayControls = controls.filter(c => c.controlled_at.startsWith(today));
    
    return {
        total: todayControls.length,
        accepted: todayControls.filter(c => c.summary.overall_status === 'pass').length,
        rejected: todayControls.filter(c => c.summary.overall_status === 'fail').length,
        issues: todayControls.filter(c => c.summary.visual_issues > 0 || c.summary.temperature_issues > 0).length
    };
});

// Selector for current session summary
export const qualityCurrentSessionStatsSelector = atom((get) => {
    const session = get(qualityActiveControlAtom);
    const items = session.items || [];
    
    const accepted = items.filter(i => i.quantity_accepted > 0).length;
    const rejected = items.filter(i => i.is_rejected).length;
    const tempIssues = items.filter(i => i.checks.temperature.status === 'fail').length;
    
    return {
        total: items.length,
        accepted,
        rejected,
        tempIssues,
        status: rejected > 0 || tempIssues > 0 ? 'fail' : 'pass'
    };
});
