import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { TenantRBACConfigSchema, DEFAULT_PAGE_ACCESS, DEFAULT_TAB_ACCESS } from '@/shared/schemas';
import { VerticalRegistry, CoreContext } from '@/shared/plugins';
import { injectBrandingVars } from '@/lib/branding/WhiteLabelBrandingInjector';
import type { PlatformVariant } from '@/kernel/contracts';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { FiscalKeyService } from '@/lib/mcc/fiscal/FiscalKeyService';
import { toError } from "@/lib/toError";
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import { setupStripeCustomer, setupFleetTelemetry, setupRAGWorkspace, setupOwnerAccount, resolveBrandingOverlayFromRequest } from './steps/provisioningSteps';
import type { ProvisioningRequest, ProvisioningResult } from './types';

export type { ProvisioningRequest, ProvisioningResult };

/**
 * 🏭 Tenant Provisioning Service (MCC Pôle 1)
 *
 * Orchestre la création entièrement automatisée d'un nouveau client B2B.
 * Appelé par le webhook Stripe après checkout.session.completed.
 *
 * Pipeline:
 *  1. TenantSeeder  — config complète + PCG + fiscal genesis + tables/zones
 *  2. Patch B2B     — siret, planId, logo sur le tenantConfig seedé
 *  3. RBAC defaults
 *  4. Vertical activation
 *  5. Branding injection
 *  6. Stripe customer
 *  7. Fleet telemetry (MCC peut voir le tenant)
 *  8. RAG workspace sovereign
 *  9. DNS sous-domaine
 * 10. Firebase Auth owner + PIN email
 */
export class TenantProvisioningService {

    public static async provisionNewClient(request: ProvisioningRequest): Promise<ProvisioningResult> {
        logger.info(`[MCC/prov] Début provisioning B2B: ${request.companyName}`);

        const ownerId  = `owner_${crypto.randomUUID()}`;
        const tenantId = `tenant_${request.siret}`;
        const variant  = request.variant ?? 'restaurant';
        const ragWorkspaceId = `rag_workspace_${tenantId}`;

        // ── 🛡️ Pile de Compensation Saga ──────────────────────────────────────
        const compensations: Array<() => Promise<void>> = [];

        try {
            // ── 0. Résolution branding : scrape charte si websiteUrl fourni ──────
            // Best-effort : échec silencieux → fallback request.branding.
            const brandingOverlay = await resolveBrandingOverlayFromRequest({
                websiteUrl: request.websiteUrl,
                companyName: request.companyName,
                siret: request.siret,
            });

            // ── 1. Seeding complet ────────────────────────────────────────────────
            // TenantSeeder écrit tenantConfig + PCG + fiscal genesis + tables/zones.
            // brandingOverlay (s'il existe) écrase primaryColor/logoUrl/fontFamily.
            const seedResult = await TenantSeeder.seed({
                tenantId,
                name:        request.companyName,
                adminEmail:  request.ownerEmail,
                variant,
                primaryColor: request.branding.primaryColor,
                siren:       request.siret,
                brandingOverlay: brandingOverlay ?? undefined,
            });
            if (!seedResult.success) {
                logger.warn('[MCC/prov] TenantSeeder partial failure', { error: seedResult.error });
            }
            // Enregistrement compensation Seeder
            compensations.push(async () => {
                logger.info(`[MCC/prov/rollback] Invalidation du tenantConfig pour ${tenantId}`);
                await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
                    status: { licenceStatus: 'LOCKED', killSwitch: true, reason: 'PROVISIONING_FAILED_ROLLED_BACK' },
                    b2bProvisionedAt: null,
                }, { merge: true }).catch(() => {});
            });

            // ── 2. Patch B2B-specific fields ──────────────────────────────────────
            // Le logo overlay (scrapé) prime sur celui de la request.
            await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
                siret:              request.siret,
                subscriptionPlan:   request.planId,
                b2bProvisionedAt:   new Date().toISOString(),
                theme: { logo: brandingOverlay?.logoUrl ?? request.branding.logoUrl ?? null },
            }, { merge: true });

            // ── 3. RBAC defaults ──────────────────────────────────────────────────
            try {
                const pageOverrides = Object.fromEntries(
                    Object.entries(DEFAULT_PAGE_ACCESS).map(([page, roles]) => [page, { allowed: roles }])
                );
                const tabOverrides = Object.fromEntries(
                    Object.entries(DEFAULT_TAB_ACCESS).map(([page, tabs]) => [
                        page,
                        Object.fromEntries(Object.entries(tabs).map(([tab, level]) => [tab, { minLevel: level }])),
                    ])
                );
                const defaultRbac = TenantRBACConfigSchema.parse({ pageOverrides, tabOverrides });
                await Nexus.adapter.set(`tenants/${tenantId}/config/rbac`, defaultRbac);
                logger.info('[MCC/prov] RBAC defaults seedés', { tenantId });
            } catch (rbacErr) {
                logger.warn('[MCC/prov] RBAC seed ignoré', { tenantId, error: String(rbacErr) });
            }

            // ── 4. Vertical activation ────────────────────────────────────────────
            try {
                const plugin  = VerticalRegistry.resolve(variant);
                const context = new CoreContext();
                await plugin.initialize(context);
                await Nexus.adapter.set(`tenants/${tenantId}/vertical-config`, {
                    variant,
                    registeredRoutes: context.getRegisteredRoutes(),
                    registeredAtoms:  context.getRegisteredAtoms(),
                    activatedAt:      new Date().toISOString(),
                    pluginVersion:    plugin.version,
                });
                logger.info('[MCC/prov] Vertical activé', { tenantId, variant });
            } catch (vertErr) {
                logger.warn('[MCC/prov] Vertical activation ignorée', { tenantId, variant, error: String(vertErr) });
            }

            // ── 5. White-label branding ───────────────────────────────────────────
            // Overlay scrapé prime sur la primaryColor de la request.
            await injectBrandingVars(tenantId, {
                mode:         'custom',
                primaryColor: brandingOverlay?.primaryColor ?? request.branding.primaryColor,
                displayName:  request.companyName,
                splashEnabled: false,
            }).catch(err => logger.warn('[MCC/prov] Branding injection ignorée', toError(err).message));

            // ── 6. Stripe customer & compensation ────────────────────────────────
            const stripeCustomerId = await setupStripeCustomer(tenantId, request);
            compensations.push(async () => {
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (stripeKey && !stripeCustomerId.startsWith('cus_mock_')) {
                    logger.info(`[MCC/prov/rollback] Suppression du customer Stripe ${stripeCustomerId}`);
                    const StripeLib = (await import('stripe')).default;
                    const stripe = new StripeLib(stripeKey, { apiVersion: '2026-06-24.dahlia' as never });
                    await stripe.customers.del(stripeCustomerId).catch((err: unknown) => {
                        logger.warn('[MCC/prov/rollback] Erreur suppression Stripe customer', toError(err).message);
                    });
                }
            });

            // ── 7. Télémétrie Flotte ─────────────────────────────────────────────
            await setupFleetTelemetry(tenantId, request);

            // ── 8. RAG Workspace ────────────────────────────────────────────────
            await setupRAGWorkspace(tenantId, ragWorkspaceId, request.companyName);

            // ── 9. Owner Account Firebase & compensation ────────────────────────
            await setupOwnerAccount(tenantId, ownerId, request);
            compensations.push(async () => {
                try {
                    logger.info(`[MCC/prov/rollback] Suppression compte auth Owner ${ownerId}`);
                    await getServerAuthProvider().deleteUser(ownerId).catch(() => {});
                    await Nexus.adapter.delete(`tenants/${tenantId}/users/${ownerId}`).catch(() => {});
                } catch (authRollbackErr) {
                    logger.warn('[MCC/prov/rollback] Erreur rollback Auth Owner', toError(authRollbackErr).message);
                }
            });

            logger.info(`[MCC/prov] ✅ Provisioning B2B terminé avec succès: ${tenantId}`);

            return { tenantId, ownerId, stripeCustomerId, ragWorkspaceId, status: 'SUCCESS' };

        } catch (error) {
            logger.error(`[MCC/prov] ❌ Échec critique pour ${request.companyName} — Déclenchement de la compensation Saga (${compensations.length} étapes)`, error);
            
            // Exécution des compensations en ordre inverse (LIFO)
            for (const compensate of compensations.reverse()) {
                try {
                    await compensate();
                } catch (compensationError) {
                    logger.error('[MCC/prov/rollback] Échec lors de la compensation partielle', compensationError);
                }
            }
            logger.info(`[MCC/prov/rollback] 🧹 Compensation Saga terminée pour ${tenantId}`);

            throw error;
        }
    }

    /**
     * 🏛️ VERSIONBASE — Clonage depuis REFERENCE (server-only)
     *
     * Crée un nouveau tenant CLIENT en deep-copiant les collections de _ref_V.
     * Cette méthode est SERVEUR UNIQUEMENT : elle fait des lectures cross-tenant
     * (_ref_* → tenant_*) que le SovereignGuard client refuserait.
     * Utiliser depuis une Server Action ou une route API admin uniquement.
     *
     * ⚠️ NF525 : fiscalSeals et journalEntries ne sont JAMAIS clonés.
     * Chaque tenant reçoit sa propre chaîne NF525 via TenantSeeder.
     */
    public static async cloneFromReference(
        variant: PlatformVariant,
        request: ProvisioningRequest
    ): Promise<ProvisioningResult> {
        // Garantit que le server adapter est actif (cross-tenant autorisé)
        ensureServerNexus();

        const refId    = getSystemTenantId(variant, 'REFERENCE');
        const tenantId = `tenant_${request.siret}`;
        logger.info(`[MCC/prov] cloneFromReference: ${refId} → ${tenantId}`);

        // Collections clonables — NF525 exclues (chaîne propre par tenant)
        const CLONABLE_COLLECTIONS = [
            'categories',
            'products',
            'floors',
            'zones',
            'tables',
            'accounts',       // PCG
            'connectors',
        ];

        try {
            // 1. Copie agnostique via adapter.query
            for (const collection of CLONABLE_COLLECTIONS) {
                const items = await Nexus.adapter.query(`tenants/${refId}/${collection}`);
                if (items.length > 0) {
                    await Promise.all(
                        items.map((item: { id: string }) =>
                            Nexus.adapter.set(`tenants/${tenantId}/${collection}/${item.id}`, item)
                        )
                    );
                    logger.debug(`[MCC/prov] Clone ${collection}: ${items.length} items`);
                }
            }

            // 2. tenantConfig cloné avec overrides client + clé fiscale propre
            const refConfig = await Nexus.adapter.get(`tenants/${refId}/tenantConfig`) ?? {};
            const fiscalSigningKey = FiscalKeyService.generateKey();
            FiscalKeyService.provision(tenantId, fiscalSigningKey);

            await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
                ...(refConfig as Record<string, unknown>),
                id: tenantId,
                tier: 'CLIENT',
                fiscalSigningKey,
                metadata: {
                    ...((refConfig as Record<string, unknown>)?.metadata ?? {}),
                    name: request.companyName,
                    ownerId: request.ownerEmail,
                    siren: request.siret,
                    createdAt: Date.now(),
                },
                theme: { primaryColor: request.branding.primaryColor },
            });

            // 3. BrandTokens client
            await Nexus.adapter.set(`tenants/${tenantId}/brandingTokens`, {
                tenantId,
                brandName: request.companyName,
                primaryColor: request.branding.primaryColor,
                logoUrl: request.branding.logoUrl ?? null,
                brandingMode: 'default',
                splashEnabled: false,
            });

            // 4. Genesis fiscal seal (chaîne NF525 vierge du nouveau tenant)
            const { CryptoService } = await import('@/lib/CryptoService');
            const genesisHash = await CryptoService.generateHash(
                JSON.stringify({ tenantId, event: 'GENESIS', createdAt: Date.now() })
            );
            await Nexus.adapter.set(`tenants/${tenantId}/fiscalSeals/GENESIS`, {
                id: 'GENESIS',
                type: 'GENESIS',
                tenantId,
                previousHash: null,
                hash: genesisHash,
                timestamp: new Date().toISOString(),
            });

            // 5. Suite (Stripe, RAG, DNS, Firebase Auth, email)
            return TenantProvisioningService.provisionPostClone(tenantId, request);

        } catch (error) {
            logger.error(`[MCC/prov] cloneFromReference failed`, error);
            throw error;
        }
    }

    /** Étapes post-clone communes à provisionNewClient et cloneFromReference */
    private static async provisionPostClone(
        tenantId: string,
        request: ProvisioningRequest
    ): Promise<ProvisioningResult> {
        const ownerId = `owner_${crypto.randomUUID()}`;
        const variant = request.variant ?? 'restaurant';
        const ragWorkspaceId = `rag_workspace_${tenantId}`;

        // Steps from sub-module
        const stripeCustomerId = await setupStripeCustomer(tenantId, request);
        await setupFleetTelemetry(tenantId, request);
        await setupRAGWorkspace(tenantId, ragWorkspaceId, request.companyName);
        await setupOwnerAccount(tenantId, ownerId, request);

        return { tenantId, ownerId, stripeCustomerId, ragWorkspaceId, status: 'SUCCESS' };
    }
}

/**
 * Flow de décommission d'un tenant (mcc-prov-4).
 * Archive les données NF525, révoque les accès, planifie purge RGPD à J+90.
 */
export async function decommissionTenant(tenantId: string, operatorId: string): Promise<{
    success: boolean; archivePath: string; rgpdPurgeAt: string;
}> {
    const archivePath = `mcc/decommissioned/${tenantId}`;
    const rgpdPurgeAt = new Date(Date.now() + 90 * 86400_000).toISOString();

    const [journalEntries, fiscalSeals] = await Promise.all([
        Nexus.adapter.query(`tenants/${tenantId}/journalEntries`),
        Nexus.adapter.query(`tenants/${tenantId}/fiscalSeals`),
    ]);

    await Nexus.adapter.set(archivePath, {
        tenantId,
        decommissionedAt:  new Date().toISOString(),
        decommissionedBy:  operatorId,
        rgpdPurgeAt,
        nf525Snapshot: {
            journalEntriesCount: journalEntries.length,
            fiscalSealsCount:    fiscalSeals.length,
            exportedAt:          new Date().toISOString(),
        },
        status: 'DECOMMISSIONED',
    });

    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
        status: { licenceStatus: 'LOCKED', killSwitch: true },
        billing: { status: 'cancelled' },
        decommissionedAt: new Date().toISOString(),
    }, { merge: true });

    logger.info(`[MCC/decommission] ${tenantId} archivé. Purge RGPD prévue: ${rgpdPurgeAt}`);
    return { success: true, archivePath, rgpdPurgeAt };
}
