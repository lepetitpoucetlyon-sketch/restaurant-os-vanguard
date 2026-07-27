import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';
import { EmpireInstance, ProvisioningDNA } from '@domain/types/empire';
import { fleetTelemetry } from './FleetTelemetryService';
import { TenantSeeder } from './TenantSeeder';
import { sovereignCreateWorkspace } from '@/modules/intelligence/rag/SovereignRAGClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { injectBrandingVars } from '@/infrastructure/branding/WhiteLabelBrandingInjector';

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
            // 0. Slug unicité — collision = écrasement silencieux d'un tenant existant
            const slugExists = await Nexus.adapter.get(`tenants/${dna.key}/tenantConfig`);
            if (slugExists) {
                throw new Error(`SLUG_COLLISION: tenantId "${dna.key}" est déjà utilisé — choisissez un slug différent`);
            }

            // 1. Build the Multi-Tenant Empire Instance (Global Contract)
            const newInstance: EmpireInstance = {
                id: `node_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`,
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
                status: newInstance.status
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
                    primaryColor: dna.initialPrimaryColor,
                });
                if (!seedResult.success) {
                    logger.warn('ProvisioningEngine: TenantSeeder partial failure', { error: seedResult.error });
                }
            }

            // 4. mcc-deploy-adv-1 — White-Label Branding Injector
            await injectBrandingVars(dna.key, {
                primaryColor: dna.initialPrimaryColor || '#6366f1',
                displayName: dna.name,
            }).catch(err => logger.warn('ProvisioningEngine: Branding injection skipped', String(err)));

            // 5. Initialiser le workspace Sovereign RAG pour ce nouveau tenant.
            // Non-bloquant : si le sidecar est indisponible au moment du provisionnement,
            // le workspace sera créé à la première réindexation manuelle depuis le MCC.
            try {
                await sovereignCreateWorkspace(dna.key, dna.name);
                logger.info('ProvisioningEngine: Sovereign RAG workspace initialized', { tenantId: dna.key });
            } catch (ragErr) {
                logger.warn('ProvisioningEngine: RAG workspace init skipped (sidecar unavailable)', {
                    tenantId: dna.key,
                    error: String(ragErr),
                });
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
            logger.error('ProvisioningEngine: Registry entry failed — rollback partiel', { key: dna.key, error });

            // Rollback best-effort : purge des fragments Firestore créés avant l'échec.
            // Ne jamais supprimer fiscalSeals (NF525 immuable) — ils ne sont créés qu'en fin de seed réussie.
            await Promise.allSettled([
                Nexus.adapter.delete(`tenants/${dna.key}/tenantConfig`).catch(() => {}),
                Nexus.adapter.delete(`tenants/${dna.key}/users/admin_${dna.key}`).catch(() => {}),
            ]);

            empireAudit.log({
                module: 'system',
                action: 'PROVISIONING_ROLLBACK',
                details: { key: dna.key, error: String(error) },
                severity: 'critical',
                timestamp: new Date(),
            });

            throw new Error(`Provisioning échoué pour "${dna.key}" — fragments nettoyés. Détail: ${String(error)}`);
        }
    }
};
