import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HardwareTelemetryService, HardwareTelemetryReport } from '@/lib/hardware/HardwareTelemetryService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('HardwareTelemetryService — Télémétrie Découplée & Alertes Matérielles', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devrait émettre facility.hardware_fault quand une imprimante tombe en panne', async () => {
        vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ status: 'ONLINE' });
        vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);
        const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue([] as never);

        const faultReport: HardwareTelemetryReport = {
            tenantId: 'tenant_sample',
            deviceId: 'printer_kitchen_1',
            deviceName: 'Epson TM-T88VI Cuisine',
            deviceType: 'printer',
            status: 'FAULT',
            faultCode: 'OUT_OF_PAPER',
            faultMessage: 'Rouleau de papier thermique épuisé',
            lastPing: new Date().toISOString(),
        };

        await HardwareTelemetryService.reportDeviceTelemetry(faultReport);

        expect(emitSpy).toHaveBeenCalledWith(
            'facility.hardware_fault',
            expect.objectContaining({
                tenantId: 'tenant_sample',
                deviceId: 'printer_kitchen_1',
                faultCode: 'OUT_OF_PAPER',
                severity: 'high',
            })
        );
    });

    it('devrait émettre facility.hardware_restored quand le matériel revient ONLINE', async () => {
        vi.spyOn(Nexus.adapter, 'get').mockResolvedValue({ status: 'FAULT' });
        vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);
        const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue([] as never);

        const restoredReport: HardwareTelemetryReport = {
            tenantId: 'tenant_sample',
            deviceId: 'printer_kitchen_1',
            deviceName: 'Epson TM-T88VI Cuisine',
            deviceType: 'printer',
            status: 'ONLINE',
            lastPing: new Date().toISOString(),
        };

        await HardwareTelemetryService.reportDeviceTelemetry(restoredReport);

        expect(emitSpy).toHaveBeenCalledWith(
            'facility.hardware_restored',
            expect.objectContaining({
                tenantId: 'tenant_sample',
                deviceId: 'printer_kitchen_1',
            })
        );
    });
});
