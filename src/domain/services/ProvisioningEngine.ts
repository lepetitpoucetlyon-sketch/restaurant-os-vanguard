import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { EmpireInstance, ProvisioningDNA } from '@domain/types/empire';
import { fleetTelemetry } from './FleetTelemetryService';
import { TenantSeeder } from './TenantSeeder';

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
                status: 'ONLINE', // Ready for single-core bridge
                tier: dna.tier || 'STANDARD',
                version: '4.5.0-empire',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString(),
                
                metrics: {
                    activeUsers: 0,
                    dailyRevenue: 0,
                    revenue24h: 0,
                    aiUsageCost: 0,
                    healthScore: 100,
                    errorRate: 0,
                    uptime: 100,
                    alerts: 0,
                    lowStockAlerts: 0,
                    expiringItemsCount: 0,
                    complianceScore: 100
                },

                branding: {
                    primaryColor: dna.initialPrimaryColor || '#C5A059',
                    tagline: "Powered by Restaurant OS Empire"
                },

                // SaaS Control: Standard DNA Flags
                featureFlags: {
                    pos: true,
                    inventory: true,
                    analytics: dna.tier !== 'STANDARD',
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
            await fleetTelemetry.pushSiteTelemetry(newInstance.id as import('@domain/types/brands').TenantID, {
                ...newInstance,
                healthScore: newInstance.metrics.healthScore,
                complianceScore: newInstance.metrics.complianceScore,
                activeUsers: newInstance.metrics.activeUsers,
                lowStockAlerts: newInstance.metrics.lowStockAlerts,
                dailyRevenue: newInstance.metrics.dailyRevenue,
                status: newInstance.status as any // Mapping status enum
            });

            logger.info('ProvisioningEngine: Instance registered in Master Registry', {
                instanceId: newInstance.id,
                url: `https://${dna.key}.nexus-fleet.io`
            });

            // 3. TENANT SEED — PCG, users, fiscalSeals genesis, tables/floors/zones
            if (dna.copyBaseTemplates !== false) {
                const seedResult = await TenantSeeder.seed({
                    tenantId: dna.key,
                    name: dna.name,
                    adminEmail: dna.ownerEmail,
                    adminPin: '0000', // Default PIN — owner must change after first login
                    primaryColor: dna.initialPrimaryColor,
                });
                if (!seedResult.success) {
                    logger.warn('ProvisioningEngine: TenantSeeder partial failure', { error: seedResult.error });
                }
            }

            empireAudit.log({
                module: 'system',
                action: 'REGISTRATION_SUCCESS',
                details: { instanceId: newInstance.id, key: dna.key },
                timestamp: new Date(),
                severity: 'medium'
            });

            return newInstance;

        } catch (error: unknown) {
            logger.error('ProvisioningEngine: Registry entry failed', { error });
            throw new Error("Échec critique lors de l'enregistrement de l'instance. Vérifiez le Master Registry.");
        }
    }
};
