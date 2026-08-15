import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type DeviceType = 'printer' | 'payment_terminal' | 'iot_sensor' | 'backup_router' | 'display';

export type HardwareFaultCode =
    | 'OUT_OF_PAPER'
    | 'COVER_OPEN'
    | 'CONNECTION_LOST'
    | 'BATTERY_CRITICAL'
    | 'PAPER_JAM'
    | 'POWER_OFF';

export interface HardwareTelemetryReport {
    tenantId: string;
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    status: 'ONLINE' | 'WARNING' | 'FAULT' | 'OFFLINE';
    faultCode?: HardwareFaultCode;
    faultMessage?: string;
    ipAddress?: string;
    batteryLevel?: number;
    lastPing: string;
    metadata?: Record<string, unknown>;
}

/**
 * 🖨️ Hardware Telemetry Service (MCC Pôle 1 & Facility)
 * 
 * Enregistre et supervise l'état matériel réel des périphériques terrain
 * (Imprimantes de cuisine, TPE, Bornes, Routeurs de failover).
 * Respecte l'invariant #6 : découplage télémétrie matérielle vs crash applicatif.
 */
export class HardwareTelemetryService {
    
    /**
     * Rapporte l'état d'un périphérique matériel.
     */
    public static async reportDeviceTelemetry(report: HardwareTelemetryReport): Promise<void> {
        const path = `tenants/${report.tenantId}/hardware/${report.deviceId}`;
        const previous = await Nexus.adapter.get<HardwareTelemetryReport>(path);

        await Nexus.adapter.set(path, {
            ...report,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Détection d'un nouveau défaut
        if (report.status === 'FAULT' || report.status === 'WARNING') {
            if (previous?.status !== 'FAULT' && previous?.status !== 'WARNING') {
                logger.warn(`[HardwareTelemetry] 🚨 Défaut matériel sur ${report.deviceName} (${report.tenantId})`, {
                    faultCode: report.faultCode,
                    message: report.faultMessage,
                });

                await NexusEventBus.emit('facility.hardware_fault', {
                    v: 1,
                    tenantId: report.tenantId,
                    deviceId: report.deviceId,
                    deviceType: report.deviceType,
                    faultCode: report.faultCode ?? 'CONNECTION_LOST',
                    severity: report.status === 'FAULT' ? 'high' : 'medium',
                    message: report.faultMessage ?? `Défaut matériel détecté sur ${report.deviceName}`,
                    timestamp: new Date().toISOString(),
                });
            }
        } else if (report.status === 'ONLINE' && (previous?.status === 'FAULT' || previous?.status === 'WARNING')) {
            logger.info(`[HardwareTelemetry] ✅ Périphérique rétabli: ${report.deviceName} (${report.tenantId})`);

            await NexusEventBus.emit('facility.hardware_restored', {
                v: 1,
                tenantId: report.tenantId,
                deviceId: report.deviceId,
                deviceType: report.deviceType,
                timestamp: new Date().toISOString(),
            });
        }
    }

    /**
     * Récupère l'inventaire matériel consolidé d'un tenant.
     */
    public static async getTenantHardware(tenantId: string): Promise<HardwareTelemetryReport[]> {
        try {
            return await Nexus.adapter.query<HardwareTelemetryReport>(`tenants/${tenantId}/hardware`);
        } catch (err) {
            logger.warn(`[HardwareTelemetry] Impossible de charger le matériel pour ${tenantId}`, err);
            return [];
        }
    }
}
