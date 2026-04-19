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
} from '@/store/qualityAtoms';
import { deliveriesAtom } from '@/store/operationalAtoms';
import { QualityEngine } from '@/domain/services/QualityEngine';
import { QualityControl, QualityControlItem } from '@/domain/types/quality';
import { Delivery } from '@/domain/types/delivery';
import { logger } from '@/lib/logger';
import { useSettings } from './useSettings';
import { IDService } from '@/lib/services/IDService';

/**
 * 🛰️ useQuality - Bridge Hook (Grade VI)
 * Interface between UI and Sovereign Quality Engine
 */
export const useQuality = () => {
    const [controls, setControls] = useAtom(qualityControlsAtom);
    const [loading] = useAtom(qualityLoadingAtom);
    const [activeControl, setActiveControl] = useAtom(qualityActiveControlAtom);
    const [step, setStep] = useAtom(qualityControlStepAtom);
    const [selectedDeliveryId, setSelectedDeliveryId] = useAtom(qualitySelectedDeliveryIdAtom);
    
    const [alerts] = useAtom(qualityAlertsAtom);
    const [todayStats] = useAtom(todayReceptionStatsAtom);
    const [productConfigs] = useAtom(productQualityConfigsAtom);
    const [supplierScores] = useAtom(supplierScoresAtom);
    const deliveries = useAtomValue(deliveriesAtom) as unknown as Delivery[];
    
    const { tenantId } = useSettings();

    /**
     * Starts a new reception control session for a specific delivery
     */
    const selectDeliveryForControl = (deliveryId: string) => {
        const delivery = deliveries.find((d: Delivery) => d.id === deliveryId);
        if (!delivery) return;

        setSelectedDeliveryId(deliveryId);
        setStep(1);
        
        const newControl: Partial<QualityControl> = {
            type: 'reception',
            supplier_id: delivery.supplier_id,
            supplier_name: delivery.supplier_name,
            delivery: {
                id: deliveryId,
                reference: delivery.reference
            },
            controlled_at: new Date().toISOString(),
            items: (delivery.items || []).map((item) => ({
                id: IDService.generateId('qci'),
                product_id: item.productId,
                product_name: item.productName,
                product_category: 'other', // Default, should be resolved by config lookup
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
            })),
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
            }
        };
        
        setActiveControl(newControl);
    };

    /**
     * Updates an item in the active control
     */
    const updateControlItem = (item: QualityControlItem) => {
        const existingItems = activeControl.items || [];
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
        });
    };

    /**
     * Finalizes and persists the quality control
     */
    const submitControl = async () => {
        if (!activeControl) return null;
        
        try {
            logger.info(`[useQuality] Submitting active control for ${activeControl.supplier_name}`);
            const result = await QualityEngine.validateReception(activeControl, tenantId);
            
            // 🏛️ Sovereign Session Cleanup (Zero Debt)
            setActiveControl({
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
                }
            });
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
