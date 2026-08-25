import { useAtom } from 'jotai';
import { qualityAlertsAtom } from '../store/qualityAtoms';
import { logger } from '@/lib/logger';
import { HACCPTemperatureCascadeService } from '../services/HACCPTemperatureCascadeService';
import type { ProductCategory } from '../../../types/quality';

/**
 * 🛰️ useComplianceMapper - Grade VI
 * Real-time HACCP & Fiscal Compliance Monitoring (Internal Suture — DF-E1).
 */
export const useComplianceMapper = () => {
    const [alerts] = useAtom(qualityAlertsAtom);

    const checkDrift = (
        currentData: import('@nexus/contracts').TemperatureLog | import('@nexus/contracts').ReceptionLog,
        category?: ProductCategory
    ) => {
        const evaluation = HACCPTemperatureCascadeService.evaluateTemperature(currentData.temperature, {
            category,
        });

        if (!evaluation.isCompliant) {
            logger.warn(
                `[ComplianceMapper] Temperature Drift Detected: ${currentData.temperature}°C (Thresholds: [${evaluation.thresholds.min}°C, ${evaluation.thresholds.max}°C])`
            );
            return {
                status: evaluation.status,
                reason: currentData.temperature > evaluation.thresholds.max ? 'High Temperature' : 'Low Temperature',
                thresholds: evaluation.thresholds,
            };
        }
        return { status: 'ok', thresholds: evaluation.thresholds };
    };

    return {
        alerts,
        actions: {
            checkDrift
        }
    };
};
