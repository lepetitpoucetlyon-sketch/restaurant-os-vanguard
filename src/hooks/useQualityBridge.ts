// @ts-nocheck
// @ts-nocheck
import { useAtom } from 'jotai';
import { 
    qualityControlsAtom, 
    qualityLoadingAtom, 
    qualityActiveControlAtom,
    qualityAlertsAtom,
    todayReceptionStatsAtom 
} from '@/store/qualityAtoms';
import { QualityEngine } from '@/domain/services/QualityEngine';
import { QualityControl, QualityControlItem } from '@/domain/types/quality';
import { logger } from '@/lib/logger';
import { useSettings } from './useSettings';

/**
 * 🛰️ useQualityBridge - Grade VI
 * Sovereign nexus between UI and Quality Infrastructure
 */
export const useQualityBridge = () => {
    const [controls] = useAtom(qualityControlsAtom);
    const [loading] = useAtom(qualityLoadingAtom);
    const [activeControl, setActiveControl] = useAtom(qualityActiveControlAtom);
    const [alerts] = useAtom(qualityAlertsAtom);
    const [todayStats] = useAtom(todayReceptionStatsAtom);
    
    const { tenantId } = useSettings();

    const startReception = (supplier: { id: string, name: string }) => {
        const newControl: Partial<QualityControl> = {
            type: 'reception',
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            controlled_at: new Date().toISOString(),
            items: [],
            summary: {
                total_items: 0,
                items_accepted: 0,
                items_rejected: 0,
                temperature_issues: 0,
                visual_issues: 0,
                overall_status: 'pass',
                supplier_score_impact: 0
            }
        };
        setActiveControl(newControl);
    };

    const commitReception = async () => {
        if (!activeControl) return;
        try {
            logger.info(`[Bridge] Committing Reception for ${activeControl.supplier_name}`);
            return await QualityEngine.validateReception(activeControl, tenantId);
        } catch (error) {
            logger.error(`[Bridge] Reception failed:`, error);
            throw error;
        }
    };

    return {
        controls,
        loading,
        activeControl,
        alerts,
        todayStats,
        supplierScores: [
            { supplierId: 's1', supplierName: 'Metro France', reliabilityScore: 94 },
            { supplierId: 's2', supplierName: 'Pomona Gastronomie', reliabilityScore: 88 },
            { supplierId: 's3', supplierName: 'Transgourmet', reliabilityScore: 91 }
        ],
        actions: {
            startReception,
            commitReception,
            setActiveControl
        }
    };
};
