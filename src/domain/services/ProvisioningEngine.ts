import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { EmpireInstance, ProvisioningDNA } from '@/domain/types/empire';
import { fleetTelemetry } from './FleetTelemetryService';

/**
 * ProvisioningEngine - Orchestrates the Registry-based "Birth of a Client"
 * This service handles the infrastructure registration and DNA injection.
 */
export const ProvisioningEngine = {
    /**
     * Executes the registration of a new restaurant instance in the Master Registry.
     */
    async provisionNewInstance(dna: ProvisioningDNA): Promise<EmpireInstance> {
        logger.info('ProvisioningEngine: Initializing new Registry entry', { instanceKey: dna.key });
        
        empireAudit.log({
            module: 'system',
            action: 'REGISTRATION_STARTED',
            details: { name: dna.name, key: dna.key, tier: dna.tier },
            timestamp: new Date()
        });

        try {
            // 1. Build the Multi-Tenant Empire Instance (Global Contract)
            const newInstance: EmpireInstance = {
                id: `node_${Math.random().toString(36).substring(2, 11)}`,
                key: dna.key,
                name: dna.name.toUpperCase(),
                status: 'online', // Ready for single-core bridge
                tier: dna.tier,
                version: '4.5.0-empire',
                createdAt: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString(),
                
                metrics: {
                    activeUsers: 0,
                    dailyRevenue: 0,
                    revenue24h: 0,
                    aiUsageCost: 0,
                    healthScore: 100,
                    lowStockAlerts: 0,
                    expiringItemsCount: 0,
                    complianceScore: 100
                },

                branding: {
                    primaryColor: dna.initialPrimaryColor,
                    tagline: "Powered by Restaurant OS Empire"
                },

                // SaaS Control: Standard DNA Flags
                featureFlags: {
                    pos: true,
                    inventory: true,
                    analytics: dna.tier !== 'standard',
                    bar: false, // Optional
                    kitchen: true
                },

                security: {
                    twoFactorEnabled: true,
                    nf525Certified: true,
                    maintenanceAccessGranted: false,
                    supportAccessGranted: false // Confidentiality by default
                }
            };

            // 2. INDUSTRIAL WELD: Push to Master Registry (Shared Firebase)
            // This enables the "Single Core" to discover the client.
            await fleetTelemetry.pushSiteTelemetry(newInstance.id as any, newInstance as any);

            logger.info('ProvisioningEngine: Instance registered in Master Registry', { 
                instanceId: newInstance.id, 
                url: `https://${dna.key}.nexus-fleet.io` 
            });

            empireAudit.log({
                module: 'system',
                action: 'REGISTRATION_SUCCESS',
                details: { instanceId: newInstance.id, key: dna.key },
                timestamp: new Date(),
                severity: 'medium'
            });

            return newInstance;

        } catch (error) {
            logger.error('ProvisioningEngine: Registry entry failed', { error });
            throw new Error("Échec critique lors de l'enregistrement de l'instance. Vérifiez le Master Registry.");
        }
    }
};
