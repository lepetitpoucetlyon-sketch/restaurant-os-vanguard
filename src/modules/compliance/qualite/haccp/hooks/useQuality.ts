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
    supplierScoresAtom,
} from '../store/qualityAtoms';
import { deliveriesAtom } from '@/bootstrap/store/pillars/compliance';
import { tenantIdAtom } from '@nexus/state/SovereignGenome';
import { QualityEngine } from '../../../services/QualityEngine';
import { ActiveQualityControl, ActiveQualityControlItem } from '@nexus/contracts';
import { logger } from '@/lib/logger';
import { buildReceptionControl, buildReceptionData, buildEmptyControl } from './qualityBuilders';

/**
 * 🛰️ useQuality - Internal Mapper Hook (Grade VI)
 * Interface between UI and Sovereign Quality Engine
 */
export const useQuality = () => {
    const [controls, _setControls] = useAtom(qualityControlsAtom);
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
        const delivery = deliveries.find((d) => d.id === deliveryId);
        if (!delivery) return;

        setSelectedDeliveryId(deliveryId);
        setStep(1);

        const newControl = buildReceptionControl(delivery, deliveryId);
        setActiveControl(newControl as ActiveQualityControl);
    };

    /**
     * Updates an item in the active control
     */
    const updateControlItem = (item: ActiveQualityControlItem) => {
        const existingItems = activeControl?.items || [];
        const index = existingItems.findIndex((i) => i.id === item.id);

        let newItems;
        if (index > -1) {
            newItems = [...existingItems];
            newItems[index] = item;
        } else {
            newItems = [...existingItems, item];
        }

        if (!activeControl) return;
 
        setActiveControl({
            ...activeControl,
            items: newItems,
            color_aspect: activeControl.color_aspect ?? true,
            texture_aspect: activeControl.texture_aspect ?? true,
            odor_aspect: activeControl.odor_aspect ?? true,
        });
    };

    /**
     * Finalizes and persists the quality control
     */
    const submitControl = async () => {
        if (!activeControl) return null;

        try {
            // 👑 Transform QualityControl into Sovereign ReceptionData Contract
            const receptionData = buildReceptionData(activeControl);

            const result = await QualityEngine.validateReception(receptionData, tenantId as string);

            // 🏛️ Sovereign Session Cleanup (Zero Debt)
            setActiveControl(buildEmptyControl());
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
        setActiveControl,
    };
};
