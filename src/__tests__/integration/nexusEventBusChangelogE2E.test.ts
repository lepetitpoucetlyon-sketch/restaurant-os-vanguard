import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { registerFeatureFlagSyncHandler } from '@/shared/eventBus/handlers/FeatureFlagSyncHandler';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { SYSTEMEvents } from '@/shared/eventBus/events/system.events';

describe('🏛️ [E2E/Integration] NexusEventBus, Registre Évolutif & Handlers Cascade (Loi 12)', () => {
    const TEST_TENANT_ID = 'tenant_e2e_bistro_001';
    const unsubscribers: (() => void)[] = [];

    beforeEach(async () => {
        // Setup in-memory store in MockAdapter
        try {
            const allLogs = await ChangelogService.getForTenant(TEST_TENANT_ID, 100);
            for (const log of allLogs) {
                await Nexus.adapter.delete(`mcc/changelog/${log.id}`);
            }
        } catch {
            // Ignore if empty
        }
    });

    afterEach(() => {
        while (unsubscribers.length > 0) {
            const unsub = unsubscribers.pop();
            unsub?.();
        }
    });

    describe('1. Émission & propagation de mcc.changelog_recorded sur le Bus', () => {
        it('doit émettre un événement typé sur NexusEventBus lors de l\'enregistrement d\'un log', async () => {
            const receivedEvents: SYSTEMEvents['mcc.changelog_recorded'][] = [];

            // Souscrire à l'événement sur le bus
            const unsub = NexusEventBus.on('mcc.changelog_recorded', (payload) => {
                receivedEvents.push(payload);
            });
            unsubscribers.push(unsub);

            // Enregistrer une entrée de changelog
            const entry = await ChangelogService.record({
                tenantId: TEST_TENANT_ID,
                category: 'DEV_HOTFIX',
                action: 'DATABASE_INDEX_FIX',
                title: 'Indexation rapide des factures POS',
                description: 'Ajout de l\'index composite tenantId + timestamp',
                appliedBy: 'Dev Team (Marc)',
                authorName: 'Marc Developer',
                authorType: 'developer',
                scope: 'tenant',
                tags: ['database', 'performance', 'hotfix'],
                after: { indexCreated: true },
            });

            // Vérifications synchrones et asynchrones
            expect(entry.id).toBeDefined();
            expect(entry.commitHash).toMatch(/^[a-z0-9]{7}$/);
            expect(entry.category).toBe('DEV_HOTFIX');
            expect(entry.authorType).toBe('developer');

            // Vérifier que le bus a bien reçu l'événement
            expect(receivedEvents).toHaveLength(1);
            expect(receivedEvents[0].id).toBe(entry.id);
            expect(receivedEvents[0].tenantId).toBe(TEST_TENANT_ID);
            expect(receivedEvents[0].category).toBe('DEV_HOTFIX');
            expect(receivedEvents[0].title).toBe('Indexation rapide des factures POS');
            expect(receivedEvents[0].authorType).toBe('developer');
        });
    });

    describe('2. Ingestion Contextuelle IA & Historique Récent (Loi 12 & SupportAgent)', () => {
        it('doit fusionner et trier chronologiquement l\'historique du tenant et les mises à jour de flotte', async () => {
            // 1. Créer un log spécifique au tenant
            await ChangelogService.record({
                tenantId: TEST_TENANT_ID,
                category: 'UI_OVERRIDE',
                action: 'THEME_CUSTOMIZED',
                title: 'Couleur primaire changée en Émeraude',
                description: 'Personnalisation du thème par le restaurateur',
                appliedBy: 'Gérant du Restaurant',
                authorType: 'client',
                scope: 'tenant',
            });

            // 2. Créer une mise à jour globale de flotte
            await ChangelogService.record({
                tenantId: '__FLEET__',
                category: 'CORE_UPDATE',
                action: 'VERSION_ROLLOUT_V3',
                title: 'Déploiement Core v3.2.0 (NF525 & Factur-X)',
                description: 'Mise à niveau globale du moteur comptable',
                appliedBy: 'Nexus Release Bot',
                authorType: 'system',
                scope: 'fleet',
            });

            // 3. Récupérer le contexte IA pour le tenant
            const contextText = await ChangelogService.getRecentContextForAI(TEST_TENANT_ID, 5);

            expect(typeof contextText).toBe('string');
            expect(contextText).toContain('Couleur primaire changée en Émeraude');
            expect(contextText).toContain('Déploiement Core v3.2.0 (NF525 & Factur-X)');
            expect(contextText).toContain('client');
            expect(contextText).toContain('system');
        });
    });

    describe('3. Chaîne en Cascade : Feature Flags -> Registre Multi-Tenant', () => {
        it('doit automatiquement journaliser la bascule d\'un feature flag pour chaque tenant cible', async () => {
            const unsub = registerFeatureFlagSyncHandler();
            unsubscribers.push(unsub);

            const targetTenants = [TEST_TENANT_ID, 'tenant_e2e_pizzeria_002'];

            // Déclencher l'événement de bascule d'un feature flag sur le bus
            await NexusEventBus.emit('mcc.feature_flag_toggled', {
                v: 1,
                tenantId: TEST_TENANT_ID,
                flagKey: 'kds_coursing_v2',
                enabled: true,
                rolloutPercentage: 100,
                tenantIds: targetTenants,
                updatedBy: 'MCC Administrator',
            });

            // Vérifier pour chaque tenant qu'une entrée FEATURE_FLAG_ENABLED a été créée
            for (const tId of targetTenants) {
                const logs = await ChangelogService.getForTenant(tId, 50);
                const flagLog = logs.find(l => l.action === 'FEATURE_FLAG_ENABLED' && l.key === 'featureFlags.kds_coursing_v2');
                
                expect(flagLog).toBeDefined();
                expect(flagLog?.category).toBe('FEATURE_FLAG');
                expect(flagLog?.title).toContain('kds_coursing_v2');
                expect(flagLog?.appliedBy).toBe('MCC Administrator');
            }
        });
    });

    describe('4. Genèse Automatique dès le Provisioning (TenantSeeder)', () => {
        it('doit sceller une entrée GENESIS_CREATED lors du seeding d\'un établissement', async () => {
            const seedTenantId = 'tenant_genesis_test_999';

            // Exécuter le seed
            const result = await TenantSeeder.seed({
                tenantId: seedTenantId,
                name: 'Le Grand Bistrot de Test',
                variant: 'restaurant',
                siren: '987654321',
                adminEmail: 'chef@grandbistrot.fr',
                adminPin: '1234',
            });

            expect(result.success).toBe(true);

            // Vérifier que l'entrée GENESIS_CREATED est bien dans le registre
            const logs = await ChangelogService.getForTenant(seedTenantId, 50);
            const genesisLog = logs.find(l => l.category === 'GENESIS' && l.action === 'GENESIS_CREATED');

            expect(genesisLog).toBeDefined();
            expect(genesisLog?.title).toBe('Création du restaurant "Le Grand Bistrot de Test" (restaurant)');
            expect(genesisLog?.authorType).toBe('client');
            expect(genesisLog?.after).toMatchObject({
                variant: 'restaurant',
                siren: '987654321',
            });
        });
    });

    describe('5. Idempotence & Prévention des Boucles (Loi 12)', () => {
        it('doit garantir l\'intégrité des événements sans boucle infinie', async () => {
            let executionCount = 0;

            const unsub = NexusEventBus.on('system.audit_log', async () => {
                executionCount++;
            });
            unsubscribers.push(unsub);

            await NexusEventBus.emit('system.audit_log', {
                v: 1,
                tenantId: TEST_TENANT_ID,
                action: 'TENANT_BACKUP_COMPLETED',
                userId: 'system:cron',
                severity: 'low',
                details: { backupId: 'BAK-001', sizeBytes: 1024 },
            });

            expect(executionCount).toBe(1);
        });
    });
});
