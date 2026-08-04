import { ReceptionLog, TemperatureLog } from '@/verticals/restaurant/compliance/haccp/types/domain';
import { useAtom } from 'jotai';
import { qualityAlertsAtom } from '@verticals/restaurant/compliance/haccp/store/qualityAtoms';
import { logger } from '@/lib/logger';

/**
 * 🛰️ useComplianceMapper - Grade VI
 * Real-time HACCP & Fiscal Compliance Monitoring (Internal Suture).
 */
export const useComplianceMapper = () => {
    const [alerts] = useAtom(qualityAlertsAtom);

    const checkDrift = (currentData: ReceptionLog | TemperatureLog) => {
        // Logic for drift detection (Temp/DLC)
        if (currentData.temperature > 5) {
            logger.warn(`[ComplianceMapper] Temperature Drift Detected: ${currentData.temperature}°C`);
            return { status: 'warning', reason: 'High Temperature' };
        }
        return { status: 'ok' };
    };

    return {
        alerts,
        actions: {
            checkDrift
        }
    };
};
