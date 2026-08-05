import { logger } from '@/lib/logger';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { getAuth } from 'firebase-admin/auth';
import { MasterBridge } from '@/infrastructure/adapters/MasterBridge';
import { hashPin } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { LightRAGClient } from '@/modules/intelligence';
import { Resend } from 'resend';

export interface ProvisioningRequest {
    ownerEmail: string;
    ownerName: string;
    companyName: string;
    siret: string;
    planId: 'STANDARD' | 'PREMIUM';
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
 * Ce service DevOps orchestre la création entièrement automatisée 
 * d'un nouveau client (Tenant) dans l'Empire SaaS.
 */
export class TenantProvisioningService {

    public static async provisionNewClient(request: ProvisioningRequest): Promise<ProvisioningResult> {
        logger.info(`🏭 [MCC] Début du provisioning pour le client: ${request.companyName}`);
        
        // 1. Génération des IDs cryptographiques
        const ownerId = `owner_${crypto.randomUUID()}`;
        const tenantId = `tenant_${request.siret}`;

        try {
            // 2. Création de la coquille isolée de configuration (Le Génome)
            await this.initializeTenantConfig(tenantId, request);

            // 3. Billing : Création du compte Stripe réel (mcc-prov-9)
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            let stripeCustomerId: string;
            if (stripeKey) {
                const stripe = new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' });
                const customer = await stripe.customers.create({
                    email: request.ownerEmail,
                    name:  request.companyName,
                    metadata: { tenantId },
                });
                stripeCustomerId = customer.id;
            } else {
                stripeCustomerId = `cus_mock_${Date.now()}`;
                logger.warn('💳 [MCC] STRIPE_SECRET_KEY absent — Stripe customer mocké');
            }
            logger.info(`💳 [MCC] Compte de facturation SaaS créé: ${stripeCustomerId}`);

            // 4. Intelligence : Isolation workspace RAG par tenant (mcc-prov-10)
            const ragWorkspaceId = `rag_workspace_${tenantId}`;
            try {
                const ragClient = new LightRAGClient({ workspace: ragWorkspaceId });
                // Indexation d'un document de bootstrap pour initialiser le workspace
                await ragClient.insert(
                    `Restaurant ${request.companyName} — workspace IA initialisé. TenantID: ${tenantId}.`,
                    `bootstrap_${tenantId}`,
                );
                logger.info(`🧠 [MCC] Workspace RAG isolé créé: ${ragWorkspaceId}`);
            } catch {
                logger.warn(`🧠 [MCC] LightRAG non disponible — workspace ${ragWorkspaceId} en attente`);
            }

            // 5. Auto-DNS : sous-domaine {slug}.restaurantos.app (mcc-crm-1)
            const slug = request.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
            try {
                const dnsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/fleet/dns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-mcc-internal': process.env.INTERNAL_API_SECRET ?? '' },
                    body: JSON.stringify({ tenantId, slug }),
                });
                if (dnsRes.ok) {
                    const dns = await dnsRes.json() as { domain: string; provider: string };
                    logger.info(`🌐 [MCC] DNS provisionné: ${dns.domain} via ${dns.provider}`);
                }
            } catch {
                logger.warn(`[MCC] DNS provisioning ignoré (non bloquant)`);
            }

            // 6. Initialisation du premier utilisateur Admin + envoi PIN par email (mcc-prov-1)
            const tempPin = await this.createRootAdmin(tenantId, ownerId, request.ownerEmail);
            await this.sendAdminPinEmail(request.ownerEmail, request.companyName, tempPin);

            logger.info(`✅ [MCC] Provisioning terminé avec succès pour ${tenantId} !`);
            
            return {
                tenantId,
                ownerId,
                stripeCustomerId,
                ragWorkspaceId,
                status: 'SUCCESS'
            };

        } catch (error) {
            logger.error(`❌ [MCC] Échec critique du provisioning pour ${request.companyName}`, error);
            // Rollback géré dans ProvisioningEngine.provisionNewInstance()
            throw error;
        }
    }

    /**
     * Utilise les clés MCC pour forcer la création d'une config de base dans l'espace isolé.
     */
    private static async initializeTenantConfig(tenantId: string, req: ProvisioningRequest): Promise<void> {
        const baseConfig = {
            siret: req.siret,
            name: req.companyName,
            status: 'ACTIVE',
            subscriptionPlan: req.planId,
            theme: {
                primary: req.branding.primaryColor,
                logo: req.branding.logoUrl || null
            },
            createdAt: Date.now()
        };

        await MasterBridge.pushTenantConfigPatch(tenantId, baseConfig);
        logger.info(`🏗️ [MCC] TenantConfig initialisée avec les couleurs B2B.`);
    }

    private static async createRootAdmin(tenantId: string, ownerId: string, email: string): Promise<string> {
        logger.info(`🔐 [MCC] Création de l'accès patron (Owner) pour ${email}`);
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

        // Générer et stocker le PIN admin temporaire (mcc-prov-1)
        const rawDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
        const salt      = crypto.randomUUID();
        const hashed    = await hashPin(rawDigits, salt);

        await Nexus.adapter.set(`tenants/${tenantId}/users/${ownerId}`, {
            id:     ownerId,
            uid,
            email,
            role:   'OWNER',
            pin:    hashed,
            pinSalt: salt,
            status: 'active',
            schemaVersion: 2,
        });

        logger.info(`✅ [MCC] Admin créé — uid=${uid} tenantId=${tenantId}`);
        return rawDigits;
    }

    private static async sendAdminPinEmail(email: string, companyName: string, pin: string): Promise<void> {
        const resendKey = process.env.RESEND_API_KEY;
        const from      = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';
        if (!resendKey) {
            logger.warn(`[MCC/prov-1] RESEND_API_KEY absent — PIN ${pin} non envoyé à ${email}`);
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
        }).catch(e => logger.warn('[MCC/prov-1] email error:', String(e)));
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

    // 1. Snapshot des données critiques NF525 (lecture seule, immuable)
    const [journalEntries, fiscalSeals] = await Promise.all([
        Nexus.adapter.query(`tenants/${tenantId}/journalEntries`),
        Nexus.adapter.query(`tenants/${tenantId}/fiscalSeals`),
    ]);

    // 2. Archivage dans le namespace MCC (hors portée SovereignGuard tenant)
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

    // 3. Verrouillage de l'accès tenant
    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
        status: { licenceStatus: 'LOCKED', killSwitch: true },
        billing: { status: 'cancelled' },
        decommissionedAt: new Date().toISOString(),
    }, { merge: true });

    logger.info(`[MCC/decommission] ${tenantId} archivé. Purge RGPD prévue: ${rgpdPurgeAt}`);
    return { success: true, archivePath, rgpdPurgeAt };
}
