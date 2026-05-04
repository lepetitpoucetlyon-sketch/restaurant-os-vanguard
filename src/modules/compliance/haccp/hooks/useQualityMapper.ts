import { useAtom } from 'jotai';
import { 
    qualityControlsAtom, 
    qualityLoadingAtom, 
    qualityActiveControlAtom,
    qualityAlertsAtom,
    todayReceptionStatsAtom 
} from '@modules/compliance/haccp/store/qualityAtoms';
import { QualityEngine } from '@domain/services/QualityEngine';
import { QualityControl, QualityControlItem } from '@domain/types/quality';
import { logger } from '@/lib/logger';
import { useSettings } from '@/hooks/useSettings';
import { useTenant } from '@/hooks';

/**
 * 🛰️ useQualityMapper - Grade VI
 * Sovereign nexus between UI and Quality Infrastructure (Internal Suture)
 */
export const useQualityMapper = () => {
    const [controls] = useAtom(qualityControlsAtom);
    const [loading] = useAtom(qualityLoadingAtom);
    const [activeControl, setActiveControl] = useAtom(qualityActiveControlAtom);
    const [alerts] = useAtom(qualityAlertsAtom);
    const [todayStats] = useAtom(todayReceptionStatsAtom);
    
    const { tenantId } = useTenant();

    const startReception = (supplier: { id: string, name: string }) => {
        const newControl: QualityControl = {
            id: `qc-${Math.random().toString(36).substring(7)}`,
            control_number: `QC-${Date.now()}`,
            type: 'reception',
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            controlled_at: new Date().toISOString(),
            controlled_by: 'system',
            controller_name: 'Antigravity',
            items: [],
            delivery_conditions: {
                vehicle_type: 'unknown',
                vehicle_temperature: { compliant: true, measured: 0 },
                vehicle_cleanliness: 'not_checked',
                packaging_integrity: 'intact',
                delivery_time_compliant: true
            },
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
                fingerprint: 'pending'
            }
        };
        setActiveControl(newControl as any);
    };

    const commitReception = async () => {
        if (!activeControl) return;
        try {
            // 👑 Transform UI state into Sovereign Domain Contract
            // 💍 LE SERTI MYSTÉRIEUX : Utilisation de l'Adapter Agnostique
            const receptionData: import('@domain/schemas/haccp').ReceptionData = {
                deliveryId: activeControl.delivery?.id || 'manual',
                supplierName: activeControl.supplier_name || 'UNKNOWN',
                truckTemp: activeControl.delivery_conditions?.vehicle_temperature?.measured || 0,
                hygieneStatus: 'acceptable',
                itemsChecked: (activeControl.items || []).map(item => {
                    const isOk = item.decision === 'accepted' || item.decision === 'accepted_reservation';
                    const isWarning = item.decision === 'partially_accepted';
                    
                    return {
                        id: item.product_id,
                        name: item.product_name || 'PRODUIT_INCONNU',
                        status: (isOk ? 'ok' : (isWarning ? 'warning' : 'rejected')) as 'warning' | 'rejected' | 'ok',
                        quantity: item.quantity_delivered,
                        temp: item.checks?.temperature?.measured
                    };
                }),
                validatedBy: activeControl.controller_name || 'Antigravity'
            };

            return await QualityEngine.validateReception(receptionData, tenantId);
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
