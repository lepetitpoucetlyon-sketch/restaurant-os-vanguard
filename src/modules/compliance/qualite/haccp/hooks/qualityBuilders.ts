import {
    DeliveryItem,
    QualityControl,
    ActiveQualityControl,
    ActiveQualityControlItem,
    ReceptionData,
} from '@nexus/contracts';
import { IDService } from '@/infrastructure/adapters/IDAdapter';

/** Delivery minimal contract consommé par les builders (évite un couplage large). */
interface DeliveryLike {
    id?: string;
    supplier_id: string;
    supplier_name: string;
    items?: DeliveryItem[];
}

/** Signale (télémétrie) un item de livraison auquel il manque des métadonnées produit. */
function reportMissingMetadata(item: DeliveryItem): void {
    if (item.unit && item.productName) return;
    import('@/lib/nexus/TelemetryService').then(({ TelemetryService }) =>
        TelemetryService.reportIssue('FALLBACK_VALUE', 'QualityEngine', {
            field: 'productMetadata',
        }),
    );
}

/** Projette un DeliveryItem en item de contrôle qualité actif (avec defaults Grade X). */
function buildControlItem(item: DeliveryItem): ActiveQualityControlItem {
    reportMissingMetadata(item);
    return {
        id: IDService.generateId('qci'),
        product_id: item.productId,
        product_name: item.productName || 'PRODUIT_INCONNU',
        product_category: 'other',
        quantity_ordered: item.quantity,
        quantity_delivered: item.quantity,
        quantity_accepted: item.quantity,
        quantity_rejected: 0,
        expiry_type: 'dlc',
        days_until_expiry: 0,
        is_short_dlc: false,
        unit: item.unit || 'pc',
        is_rejected: false,
        decision: 'accepted',
        corrective_action: 'none',
        checks: {
            visual: { performed: false, status: 'pass', aspects: [], photos: [] },
            temperature: {
                required: true,
                performed: false,
                target: { min: 0, max: 4 },
                status: 'pass',
                warning_threshold: 4,
            },
            weight: {
                required: false,
                performed: false,
                unit: item.unit || 'kg',
                status: 'pass',
                tolerance_percent: 5,
            },
            freshness: { required: true, performed: false, score: 5 },
        },
        batch_number: '',
        lot_number: '',
        origin: 'France', // Default Grade X Origin
        production_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 86400000 * 3).toISOString(), // +3 days default
        decision_reason: 'N/A',
    };
}

/** Construit un nouveau contrôle de réception complet pour une livraison donnée. */
export function buildReceptionControl(delivery: DeliveryLike, deliveryId: string): QualityControl {
    const itemCount = delivery.items?.length || 0;
    return {
        id: IDService.generateId('qc'),
        control_number: `QC-${Date.now()}`,
        type: 'reception',
        supplier_id: delivery.supplier_id,
        supplier_name: delivery.supplier_name,
        controlled_at: new Date().toISOString(),
        controlled_by: 'system', // Should be current user
        controller_name: 'Antigravity',
        delivery: {
            id: deliveryId,
            reference: delivery.id || 'UNKNOWN', // Grade X Suture: Using ID as primary reference if manual reference is missing
        },
        duration_minutes: 0,
        color_aspect: true,
        texture_aspect: true,
        odor_aspect: true,
        items: (delivery.items || []).map(buildControlItem),
        delivery_conditions: {
            vehicle_type: 'unknown',
            vehicle_temperature: { compliant: true, measured: 0 },
            vehicle_cleanliness: 'not_checked',
            packaging_integrity: 'intact',
            delivery_time_compliant: true,
        },
        signature: {
            captured: false,
            data: '',
            signer_name: '',
        },
        summary: {
            total_items: itemCount,
            items_accepted: itemCount,
            items_rejected: 0,
            temperature_issues: 0,
            visual_issues: 0,
            overall_status: 'pass',
            supplier_score_impact: 0,
        },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false,
            fingerprint: 'pending',
        },
    };
}

/** Statut UI (ok/warning/rejected) d'un item selon sa décision. */
function itemReceptionStatus(decision: ActiveQualityControlItem['decision']): 'ok' | 'warning' | 'rejected' {
    if (decision === 'accepted' || decision === 'accepted_reservation') return 'ok';
    if (decision === 'partially_accepted') return 'warning';
    return 'rejected';
}

/** Transforme un contrôle qualité actif en contrat Sovereign ReceptionData. */
export function buildReceptionData(activeControl: ActiveQualityControl): ReceptionData {
    const cleanliness = activeControl.delivery_conditions.vehicle_cleanliness;
    return {
        deliveryId: activeControl.delivery?.id || 'manual',
        supplierName: activeControl.supplier_name,
        truckTemp: activeControl.delivery_conditions.vehicle_temperature.measured || 0,
        hygieneStatus: (cleanliness === 'not_checked' ? 'acceptable' : cleanliness) as
            | 'dirty'
            | 'clean'
            | 'acceptable',
        itemsChecked: activeControl.items.map((item) => ({
            id: item.product_id,
            name: item.product_name || 'PRODUIT_INCONNU',
            status: itemReceptionStatus(item.decision),
            quantity: item.quantity_delivered,
            temp: item.checks.temperature.performed ? item.checks.temperature.measured : undefined,
        })),
        validatedBy: activeControl.controller_name || 'unknown',
    };
}

/** Contrôle vide « PENDING » utilisé pour réinitialiser la session (Zero Debt). */
export function buildEmptyControl(): ActiveQualityControl {
    return {
        id: IDService.generateId('qc'),
        control_number: 'PENDING',
        type: 'reception',
        delivery: { id: 'manual', reference: 'manual' },
        duration_minutes: 0,
        supplier_id: '',
        supplier_name: '',
        controlled_at: new Date().toISOString(),
        controlled_by: '',
        controller_name: '',
        color_aspect: true,
        texture_aspect: true,
        odor_aspect: true,
        items: [],
        delivery_conditions: {
            vehicle_type: 'unknown',
            vehicle_temperature: { compliant: true, measured: 0 },
            vehicle_cleanliness: 'not_checked',
            packaging_integrity: 'intact',
            delivery_time_compliant: true,
        },
        signature: { captured: false, data: '', signer_name: '' },
        summary: {
            total_items: 0,
            items_accepted: 0,
            items_rejected: 0,
            temperature_issues: 0,
            visual_issues: 0,
            overall_status: 'pass',
            supplier_score_impact: 0,
        },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: false,
            fingerprint: '',
        },
    } as ActiveQualityControl;
}
