import { useAtom, useAtomValue } from 'jotai';
import { 
    qualityControlsAtom, 
    qualityLoadingAtom, 
    qualityActiveControlAtom,
    qualityControlStepAtom,
    qualitySelectedDeliveryIdAtom,
    qualityAlertsAtom,
    todayReceptionStatsAtom,
    productQualityConfigsAtom,
    supplierScoresAtom
} from '@modules/compliance/haccp/store/qualityAtoms';
import { deliveriesAtom } from '@/store/operationalAtoms';
import { tenantIdAtom } from '@/store/fleetAtoms';
import { SovereignData } from '@shared/nexus-contract';
import { QualityEngine } from '@domain/services/QualityEngine';
import { QualityControl, QualityControlItem } from '@domain/types/quality';
import { Delivery } from '@domain/types/delivery';
import { logger } from '@/lib/logger';
import { IDService } from '@/infrastructure/adapters/IDAdapter';

/**
 * 🛰️ useQuality - Internal Mapper Hook (Grade VI)
 * Interface between UI and Sovereign Quality Engine
 */
export const useQuality = () => {
    const [controls, setControls] = useAtom(qualityControlsAtom);
    const loading = useAtomValue(qualityLoadingAtom);
    const [activeControl, setActiveControl] = useAtom(qualityActiveControlAtom);
    const [step, setStep] = useAtom(qualityControlStepAtom);
    const [selectedDeliveryId, setSelectedDeliveryId] = useAtom(qualitySelectedDeliveryIdAtom);
    
    const alerts = useAtomValue(qualityAlertsAtom);
    const todayStats = useAtomValue(todayReceptionStatsAtom);
    const productConfigs = useAtomValue(productQualityConfigsAtom);
    const supplierScores = useAtomValue(supplierScoresAtom);
    const deliveries = useAtomValue(deliveriesAtom);
    
    const tenantId = useAtomValue(tenantIdAtom);

    /**
     * Starts a new reception control session for a specific delivery
     */
    const selectDeliveryForControl = (deliveryId: string) => {
        const delivery = (deliveries as unknown as Delivery[]).find((d: Delivery) => d.id === deliveryId);
        if (!delivery) return;

        setSelectedDeliveryId(deliveryId);
        setStep(1);
        
        const newControl: QualityControl = {
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
                reference: delivery.id || 'UNKNOWN' // Grade X Suture: Using ID as primary reference if manual reference is missing
            },
            color_aspect: true,
            texture_aspect: true,
            odor_aspect: true,
            items: (delivery.items || []).map((item: import('@domain/types/delivery').DeliveryItem) => {
                if (!item.unit || !item.productName) {
                    import('@/lib/nexus/TelemetryService').then(({ TelemetryService }) => 
                        TelemetryService.reportIssue('FALLBACK_VALUE', 'QualityEngine', { field: 'productMetadata' })
                    );
                }
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
                    status: 'pass',
                    is_rejected: false,
                    decision: 'accepted',
                    corrective_action: 'none',
                    checks: {
                        visual: { performed: false, status: 'pass', aspects: [], photos: [] },
                        temperature: { required: true, performed: false, target: { min: 0, max: 4 }, status: 'pass', warning_threshold: 4 },
                        weight: { required: false, performed: false, unit: item.unit || 'kg', status: 'pass', tolerance_percent: 5 },
                        freshness: { required: true, performed: false, score: 5 }
                    }
                };
            }),
            delivery_conditions: {
                vehicle_type: 'unknown',
                vehicle_temperature: { compliant: true, measured: 0 },

                vehicle_cleanliness: 'not_checked',
                packaging_integrity: 'intact',
                delivery_time_compliant: true
            },
            summary: {
                total_items: delivery.items?.length || 0,
                items_accepted: delivery.items?.length || 0,
                items_rejected: 0,
                temperature_issues: 0,
                visual_issues: 0,
                overall_status: 'pass',
                supplier_score_impact: 0
            },
            metadata: {
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced: false,
                fingerprint: 'pending'
            }
        };
        
        setActiveControl(newControl as any);
    };

    /**
     * Updates an item in the active control
     */
    const updateControlItem = (item: QualityControlItem) => {
        const existingItems = activeControl?.items || [];
        const index = existingItems.findIndex(i => i.id === item.id);
        
        let newItems;
        if (index > -1) {
            newItems = [...existingItems];
            newItems[index] = item;
        } else {
            newItems = [...existingItems, item];
        }
        
        setActiveControl({
            ...activeControl,
            items: newItems
        } as any);
    };

    /**
     * Finalizes and persists the quality control
     */
    const submitControl = async () => {
        if (!activeControl) return null;
        
        try {
            // 👑 Transform QualityControl into Sovereign ReceptionData Contract
            const receptionData: import('@domain/schemas/haccp').ReceptionData = {
                deliveryId: activeControl.delivery?.id || 'manual',
                supplierName: activeControl.supplier_name,
                truckTemp: activeControl.delivery_conditions.vehicle_temperature.measured,
                hygieneStatus: (activeControl.delivery_conditions.vehicle_cleanliness === 'not_checked' ? 'acceptable' : activeControl.delivery_conditions.vehicle_cleanliness) as 'dirty' | 'clean' | 'acceptable',
                itemsChecked: activeControl.items.map(item => {
                    const isOk = item.decision === 'accepted' || item.decision === 'accepted_reservation';
                    const isWarning = item.decision === 'partially_accepted';
                    
                    return {
                        id: item.product_id,
                        name: item.product_name,
                        status: (isOk ? 'ok' : (isWarning ? 'warning' : 'rejected')) as 'warning' | 'rejected' | 'ok',
                        quantity: item.quantity_delivered,
                        temp: item.checks.temperature.performed ? item.checks.temperature.measured : undefined
                    };
                }),
                validatedBy: activeControl.controller_name || 'unknown'
            };

            const result = await QualityEngine.validateReception(receptionData, tenantId);
            
            // 🏛️ Sovereign Session Cleanup (Zero Debt)
            setActiveControl({
                id: IDService.generateId('qc'),
                control_number: 'PENDING',
                type: 'reception',
                supplier_id: '',
                supplier_name: '',
                controlled_at: new Date().toISOString(),
                controlled_by: '',
                controller_name: '',
                items: [],
                delivery_conditions: {
                    vehicle_type: 'unknown',
                    vehicle_temperature: { compliant: true, measured: 0 },

                    vehicle_cleanliness: 'not_checked',
                    packaging_integrity: 'intact',
                    delivery_time_compliant: true
                },
                signature: { captured: false, data: undefined, signer_name: undefined },
                summary: {
                    total_items: 0,
                    items_accepted: 0,
                    items_rejected: 0,
                    temperature_issues: 0,
                    visual_issues: 0,
                    overall_status: 'pass',
                    supplier_score_impact: 0
                },
                metadata: {
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    synced: false,
                    fingerprint: ''
                }
            } as any);
            setSelectedDeliveryId(null);
            setStep(1);
            
            return result;
        } catch (error) {
            logger.error(`[useQuality] Submission failed:`, error);
            throw error;
        }
    };

    return {
        controls,
        loading,
        activeControl,
        alerts,
        todayStats,
        productConfigs,
        supplierScores,
        deliveries,
        selectedDeliveryId,
        step,
        
        // Actions
        selectDeliveryForControl,
        updateControlItem,
        submitControl,
        setStep,
        setActiveControl
    };
};
