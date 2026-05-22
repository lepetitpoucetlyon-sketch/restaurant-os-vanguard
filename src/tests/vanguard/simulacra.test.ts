import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/infrastructure/adapters/MockAdapter';
import { NexusErrorCode } from '@/shared/nexus/errors';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';

/**
 * 🧪 Mock SimulatorDB (Dexie → In-Memory)
 * IndexedDB n'existe pas dans jsdom/happy-dom.
 * On remplace la Dexie Table par un Map synchrone exposant l'API minimale.
 */
const virtualMap = new Map<string, any>();

vi.mock('@/lib/simulator/SimulatorDB', () => {
    const makeTable = () => ({
        get: async (path: string) => virtualMap.get(path) ?? undefined,
        put: async (doc: any) => { virtualMap.set(doc.path, doc); },
        where: (field: string) => ({
            equals: (val: string) => ({
                filter: (fn: (d: any) => boolean) => ({
                    toArray: async () => Array.from(virtualMap.values()).filter(d => d.forkId === val).filter(fn),
                }),
                delete: async () => {
                    for (const [k, v] of virtualMap.entries()) {
                        if (v.forkId === val) virtualMap.delete(k);
                    }
                },
            }),
        }),
    });

    return {
        simulatorDb: {
            virtualStore: makeTable(),
            clearFork: async (forkId: string) => {
                for (const [k, v] of virtualMap.entries()) {
                    if (v.forkId === forkId) virtualMap.delete(k);
                }
            },
        },
        SimulatorDB: class {},
    };
});

describe('SimulacraMode via NexusInterceptor', () => {
    let mockReal: MockAdapter;

    beforeEach(async () => {
        process.env.STRICT_ISOLATION_TEST = 'true';
        // Clear virtual store between tests
        virtualMap.clear();

        // Force cleanup of any previous singleton state
        Nexus.deactivateSimulacraMode();
        Nexus.tenantOverride = null;
        
        mockReal = new MockAdapter();
        Nexus.adapter = mockReal;
        Nexus.tenantOverride = 'tenant-A';
        
        // Setup telemetry spy
        vi.spyOn(NexusTelemetryService, 'emit').mockResolvedValue(undefined);
    });

    afterEach(() => {
        delete process.env.STRICT_ISOLATION_TEST;
    });

    describe('Isolation virtuelle', () => {
        it('un write en mode Simulacra ne doit PAS persister dans le RealAdapter', async () => {
            await Nexus.activateSimulacraMode('test-fork');
            
            const testPath = 'tenants/tenant-A/orders/123';
            const testData = { id: '123', total: 100 };
            
            await Nexus.adapter.set(testPath, testData);
            
            // Assert: le document est lisible via l'adapter actif (Simulacra)
            const result = await Nexus.adapter.get(testPath);
            expect(result).toEqual(expect.objectContaining(testData));
            
            // Assert: le RealAdapter n'a rien reçu
            const realResult = await mockReal.get(testPath);
            expect(realResult).toBeNull();
            
            // 🛡️ AuditPulse SUCCESS: Vérifier que l'opération réussie a émis un pulse
            expect(NexusTelemetryService.emit).toHaveBeenCalledWith(expect.objectContaining({
                pulse: AuditPulseType.STORAGE_WRITE
            }));
            
            Nexus.deactivateSimulacraMode();
        });
    });

    describe('NexusInterceptor wrapping SimulacraAdapter', () => {
        it('le SovereignGuard doit s\'appliquer même en mode Simulacra', async () => {
            await Nexus.activateSimulacraMode('test-fork');
            
            try {
                await Nexus.adapter.get('tenants/tenant-B/orders/123');
                expect.fail('Should have thrown ACCESS_DENIED');
            } catch (error: any) {
                expect(error.toString()).toContain('ACCESS_DENIED');
            }
            
            // Vérifier AuditPulse DENIED
            expect(NexusTelemetryService.emit).toHaveBeenCalledWith(expect.objectContaining({
                pulse: AuditPulseType.ACCESS_DENIED
            }));
            
            Nexus.deactivateSimulacraMode();
        });

        it('une tentative de DELETE sur un document fiscal scellé doit être bloquée', async () => {
            await Nexus.activateSimulacraMode('test-fork');
            
            // Scoped path to tenant-A to bypass isolation and hit NF525
            const fiscalPath = 'tenants/tenant-A/fiscal/seals/2026-001';
            
            try {
                await Nexus.adapter.delete(fiscalPath);
                expect.fail('Should have thrown NF525_VIOLATION');
            } catch (error: any) {
                expect(error.toString()).toContain('NF525_VIOLATION');
            }
            
            // Vérifier AuditPulse CRITICAL
            expect(NexusTelemetryService.emit).toHaveBeenCalledWith(expect.objectContaining({
                pulse: AuditPulseType.ILLEGAL_DELETE_ATTEMPT,
                severity: 'CRITICAL'
            }));
            
            Nexus.deactivateSimulacraMode();
        });
    });
});
