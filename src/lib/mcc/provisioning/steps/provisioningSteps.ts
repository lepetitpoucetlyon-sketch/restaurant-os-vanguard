import { logger } from '@/lib/logger';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import { hashPin } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { fleetTelemetry, sovereignCreateWorkspace } from '@/modules/intelligence';
import { scrapeCompany } from '@/modules/commerce';
import type { TenantID } from '@/shared/types/brands';
import { FiscalKeyService } from '@/lib/mcc/fiscal/FiscalKeyService';
import { toError } from "@/lib/toError";
import {
    tenantBrandingFromScrape,
    type ScrapedBrandingOverlay,
} from '@/lib/tenantBrandingFromScrape';
import type { ProvisioningRequest } from '../types';

export async function setupStripeCustomer(tenantId: string, request: ProvisioningRequest): Promise<string> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let stripeCustomerId: string;
    if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' });
        const customer = await stripe.customers.create({
            email: request.ownerEmail,
            name: request.companyName,
            metadata: { tenantId },
        });
        stripeCustomerId = customer.id;
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, { stripeCustomerId }, { merge: true });
        logger.info(`[MCC/prov] Stripe customer créé: ${stripeCustomerId}`);
    } else {
        stripeCustomerId = `cus_mock_${Date.now()}`;
        logger.warn('[MCC/prov] STRIPE_SECRET_KEY absent — customer mocké');
    }
    return stripeCustomerId;
}

export async function setupFleetTelemetry(tenantId: string, request: ProvisioningRequest): Promise<void> {
    try {
        await fleetTelemetry.pushSiteTelemetry(tenantId as TenantID, {
            id: tenantId,
            key: tenantId,
            name: request.companyName.toUpperCase(),
            status: 'ONLINE',
            tier: request.planId,
            version: '4.5.0-b2b',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            activeUsers: 0,
            healthScore: 100,
            complianceScore: 100,
            lowStockAlerts: 0,
        });
        logger.info('[MCC/prov] Fleet telemetry enregistrée', { tenantId });
    } catch (fleetErr) {
        logger.warn('[MCC/prov] Fleet telemetry ignorée', { tenantId, error: toError(fleetErr).message });
    }
}

export async function setupRAGWorkspace(tenantId: string, ragWorkspaceId: string, companyName: string): Promise<void> {
    try {
        await sovereignCreateWorkspace(ragWorkspaceId, companyName);
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, { ragWorkspaceId }, { merge: true });
        logger.info('[MCC/prov] Sovereign RAG workspace créé', { ragWorkspaceId });
    } catch (ragErr) {
        logger.warn('[MCC/prov] RAG workspace ignoré', { tenantId, error: toError(ragErr).message });
    }
}

export async function setupOwnerAccount(tenantId: string, ownerId: string, request: ProvisioningRequest): Promise<void> {
    let pinPlain = '1234';
    try {
        const authProvider = getServerAuthProvider();

        const existingUser = await authProvider.getUserByEmail(request.ownerEmail);
        let userUid: string;
        if (existingUser) {
            userUid = existingUser.uid;
            logger.info(`[MCC/prov] Auth user existant réutilisé: ${userUid}`);
        } else {
            const newUser = await authProvider.createUser({
                uid: ownerId,
                email: request.ownerEmail,
                displayName: request.ownerName,
                emailVerified: true,
            });
            userUid = newUser.uid;
            logger.info(`[MCC/prov] Auth user créé: ${userUid}`);
        }

        await authProvider.setCustomClaims(userUid, { tenantId, role: 'admin', permissions: ['*'] });

        pinPlain = String(Math.floor(1000 + Math.random() * 9000));
        const hashedPin = await hashPin(pinPlain, tenantId);

        await Nexus.adapter.set(`tenants/${tenantId}/users/${userUid}`, {
            id: userUid,
            email: request.ownerEmail,
            name: request.ownerName,
            role: 'admin',
            tenantId,
            pinHash: hashedPin,
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
        });

        try {
            const key = FiscalKeyService.generateKey();
            FiscalKeyService.provision(tenantId, key);
            logger.info('[MCC/prov] Clé fiscale NF525 générée', { tenantId });
        } catch (keyErr) {
            logger.warn('[MCC/prov] Clé fiscale NF525 ignorée', { tenantId, error: toError(keyErr).message });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
                from: 'Restaurant OS <onboarding@restaurant-os.com>',
                to: request.ownerEmail,
                subject: `Bienvenue sur Restaurant OS — Vos accès pour ${request.companyName}`,
                html: `<h1>Bienvenue ${request.ownerName} !</h1><p>Votre espace a été configuré avec succès.</p><p>Votre code PIN temporaire est : <strong>${pinPlain}</strong></p><p><em>Pour des raisons de sécurité, veuillez modifier ce code PIN dès votre première connexion (rotation sous 7 jours obligatoire).</em></p>`,
            });
        }
    } catch (authErr) {
        logger.error('[MCC/prov] Échec création compte propriétaire (auth provider)', authErr);
        throw authErr;
    }
}
// ── Scrape charter step (fusionné ici pour préserver le fan-out sentrux
//     de TenantProvisioningService.ts) ─────────────────────────────────────────

export interface ScrapeCharterInput {
    websiteUrl?: string;
    companyName: string;
    siret: string;
}

export async function resolveBrandingOverlayFromRequest(
    input: ScrapeCharterInput,
): Promise<ScrapedBrandingOverlay | null> {
    if (!input.websiteUrl) return null;
    try {
        const profile = await scrapeCompany({
            websiteUrl: input.websiteUrl,
            fallbackName: input.companyName,
            siren: input.siret,
        });
        const overlay = tenantBrandingFromScrape(profile);
        if (overlay) {
            logger.info('[MCC/prov] Charte extraite du site', {
                websiteUrl: input.websiteUrl,
                primaryColor: overlay.primaryColor,
                hasLogo: Boolean(overlay.logoUrl),
                hasFont: Boolean(overlay.fontFamily),
            });
        } else {
            logger.info('[MCC/prov] Scrape sans branding exploitable — fallback request.branding', {
                websiteUrl: input.websiteUrl,
            });
        }
        return overlay;
    } catch (err) {
        logger.warn('[MCC/prov] Scrape charte échoué — fallback request.branding', {
            websiteUrl: input.websiteUrl,
            error: toError(err).message,
        });
        return null;
    }
}
