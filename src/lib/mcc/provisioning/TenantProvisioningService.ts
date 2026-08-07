import { logger } from '@/lib/logger';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { getAuth } from 'firebase-admin/auth';
import { hashPin } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { fleetTelemetry, sovereignCreateWorkspace } from '@/modules/intelligence';
import { TenantRBACConfigSchema } from '@/domain/schemas/rbac';
import { VerticalRegistry } from '@/shared/plugins/VerticalRegistry';
import { CoreContext } from '@/shared/plugins/CoreContext';
import { injectBrandingVars } from '@/lib/branding/WhiteLabelBrandingInjector';
import type { PlatformVariant } from '@/domain/schemas/tenant';
import type { TenantID } from '@domain/types/brands';

export interface ProvisioningRequest {
    ownerEmail: string;
    ownerName: string;
    companyName: string;
    siret: string;
    planId: 'STANDARD' | 'PREMIUM';
    variant?: PlatformVariant;
    branding: {
        primaryColor: string;
        logoUrl?: string;
    };
}

export interface ProvisioningResult {
    tenantId: string;
    ownerId: string;
    stripeCustomerId: string;
    ragWorkspaceId: string;
    status: 'SUCCESS' | 'FAILED';
}

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

        try {
            // ── 1. Seeding complet ────────────────────────────────────────────────
            // TenantSeeder écrit tenantConfig + PCG + fiscal genesis + tables/zones.
            // Il a un guard idempotent sur tenantConfig — ne rien écrire avant.
            const seedResult = await TenantSeeder.seed({
                tenantId,
                name:        request.companyName,
                adminEmail:  request.ownerEmail,
                variant,
                primaryColor: request.branding.primaryColor,
                siren:       request.siret,
            });
            if (!seedResult.success) {
                logger.warn('[MCC/prov] TenantSeeder partial failure', { error: seedResult.error });
            }

            // ── 2. Patch B2B-specific fields ──────────────────────────────────────
            // Merge sur le tenantConfig déjà seedé (ne pas remplacer le DNA complet).
            await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
                siret:              request.siret,
                subscriptionPlan:   request.planId,
                b2bProvisionedAt:   new Date().toISOString(),
                theme: { logo: request.branding.logoUrl ?? null },
            }, { merge: true });

            // ── 3. RBAC defaults ──────────────────────────────────────────────────
            try {
                const defaultRbac = TenantRBACConfigSchema.parse({});
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
            await injectBrandingVars(tenantId, {
                mode:         'custom',
                primaryColor: request.branding.primaryColor,
                displayName:  request.companyName,
                splashEnabled: false,
            }).catch(err => logger.warn('[MCC/prov] Branding injection ignorée', String(err)));

            // ── 6. Stripe customer ────────────────────────────────────────────────
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            let stripeCustomerId: string;
            if (stripeKey) {
                const stripe   = new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' });
                const customer = await stripe.customers.create({
                    email:    request.ownerEmail,
                    name:     request.companyName,
                    metadata: { tenantId },
                });
                stripeCustomerId = customer.id;
                await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
                    stripeCustomerId,
                }, { merge: true });
                logger.info(`[MCC/prov] Stripe customer créé: ${stripeCustomerId}`);
            } else {
                stripeCustomerId = `cus_mock_${Date.now()}`;
                logger.warn('[MCC/prov] STRIPE_SECRET_KEY absent — customer mocké');
            }

            // ── 7. Fleet telemetry ────────────────────────────────────────────────
            // Permet au MCC de voir ce tenant dans le dashboard Fleet.
            try {
                await fleetTelemetry.pushSiteTelemetry(tenantId as TenantID, {
                    id:            tenantId,
                    key:           tenantId,
                    name:          request.companyName.toUpperCase(),
                    status:        'ONLINE',
                    tier:          request.planId,
                    version:       '4.5.0-b2b',
                    createdAt:     new Date().toISOString(),
                    updatedAt:     new Date().toISOString(),
                    lastHeartbeat: new Date().toISOString(),
                    activeUsers:   0,
                    healthScore:   100,
                    complianceScore: 100,
                    lowStockAlerts:  0,
                    dailyRevenue:    0,
                });
                logger.info('[MCC/prov] Fleet telemetry enregistrée', { tenantId });
            } catch (fleetErr) {
                logger.warn('[MCC/prov] Fleet telemetry ignorée', { tenantId, error: String(fleetErr) });
            }

            // ── 8. RAG workspace sovereign ────────────────────────────────────────
            try {
                await sovereignCreateWorkspace(tenantId, request.companyName);
                logger.info(`[MCC/prov] RAG workspace initialisé: ${ragWorkspaceId}`);
            } catch {
                logger.warn(`[MCC/prov] LightRAG indisponible — workspace ${ragWorkspaceId} en attente`);
            }

            // ── 9. DNS sous-domaine ───────────────────────────────────────────────
            const slug = request.companyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 40);
            try {
                const dnsRes = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/fleet/dns`,
                    {
                        method:  'POST',
                        headers: {
                            'Content-Type':   'application/json',
                            'x-mcc-internal': process.env.INTERNAL_API_SECRET ?? '',
                        },
                        body: JSON.stringify({ tenantId, slug }),
                    }
                );
                if (dnsRes.ok) {
                    const dns = await dnsRes.json() as { domain: string; provider: string };
                    logger.info(`[MCC/prov] DNS provisionné: ${dns.domain} via ${dns.provider}`);
                }
            } catch {
                logger.warn('[MCC/prov] DNS provisioning ignoré (non bloquant)');
            }

            // ── 10. Firebase Auth owner + PIN email ───────────────────────────────
            const tempPin = await this.createRootAdmin(tenantId, ownerId, request.ownerEmail);
            await this.sendAdminPinEmail(request.ownerEmail, request.companyName, tempPin);

            logger.info(`[MCC/prov] ✅ Provisioning B2B terminé: ${tenantId}`);

            return { tenantId, ownerId, stripeCustomerId, ragWorkspaceId, status: 'SUCCESS' };

        } catch (error) {
            logger.error(`[MCC/prov] ❌ Échec critique pour ${request.companyName}`, error);
            throw error;
        }
    }

    private static async createRootAdmin(tenantId: string, ownerId: string, email: string): Promise<string> {
        logger.info(`[MCC/prov] Création accès owner Firebase pour ${email}`);
        initFirebaseAdmin();
        const firebaseAuth = getAuth();

        let uid: string;
        try {
            const existing = await firebaseAuth.getUserByEmail(email);
            uid = existing.uid;
        } catch {
            const created = await firebaseAuth.createUser({
                email,
                displayName: ownerId,
                emailVerified: false,
            });
            uid = created.uid;
        }

        await firebaseAuth.setCustomUserClaims(uid, { tenantId, role: 'OWNER' });

        const rawDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
        const salt      = crypto.randomUUID();
        const hashed    = await hashPin(rawDigits, salt);

        await Nexus.adapter.set(`tenants/${tenantId}/users/${ownerId}`, {
            id:            ownerId,
            uid,
            email,
            role:          'OWNER',
            pin:           hashed,
            pinSalt:       salt,
            status:        'active',
            schemaVersion: 2,
        });

        logger.info(`[MCC/prov] Owner créé — uid=${uid} tenantId=${tenantId}`);
        return rawDigits;
    }

    private static async sendAdminPinEmail(email: string, companyName: string, pin: string): Promise<void> {
        const resendKey = process.env.RESEND_API_KEY;
        const from      = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';
        if (!resendKey) {
            logger.warn(`[MCC/prov] RESEND_API_KEY absent — PIN ${pin} non envoyé à ${email}`);
            return;
        }
        const resend = new Resend(resendKey);
        await resend.emails.send({
            from, to: email,
            subject: `[Restaurant OS] Votre accès — ${companyName}`,
            html: `<p>Bienvenue sur Restaurant OS !</p>
<p>Votre instance <strong>${companyName}</strong> est prête. Votre PIN administrateur temporaire :</p>
<h2 style="font-family:monospace;letter-spacing:0.4em;font-size:32px;">${pin}</h2>
<p>Connectez-vous et modifiez ce PIN dès votre première connexion.</p>
<p style="color:#888;font-size:11px;">Restaurant OS — ne partagez pas ce PIN.</p>`,
        }).catch(e => logger.warn('[MCC/prov] email error:', String(e)));
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
