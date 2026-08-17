import { logger } from '@/lib/logger';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { getAuth } from 'firebase-admin/auth';
import { hashPin } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { fleetTelemetry, sovereignCreateWorkspace } from '@/modules/intelligence';
import type { TenantID } from '@/shared/types/brands';
import { FiscalKeyService } from '@/modules/finance';
import { toError } from "@/lib/toError";
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
        initFirebaseAdmin();
        const auth = getAuth();
        let user;
        try {
            user = await auth.getUserByEmail(request.ownerEmail);
            logger.info(`[MCC/prov] Firebase User existant réutilisé: ${user.uid}`);
        } catch {
            user = await auth.createUser({
                uid: ownerId,
                email: request.ownerEmail,
                displayName: request.ownerName,
                emailVerified: true,
            });
            logger.info(`[MCC/prov] Firebase User créé: ${user.uid}`);
        }

        const customClaims = { tenantId, role: 'owner', permissions: ['*'] };
        await auth.setCustomUserClaims(user.uid, customClaims);

        pinPlain = String(Math.floor(1000 + Math.random() * 9000));
        const hashedPin = await hashPin(pinPlain, tenantId);

        await Nexus.adapter.set(`tenants/${tenantId}/users/${user.uid}`, {
            id: user.uid,
            email: request.ownerEmail,
            name: request.ownerName,
            role: 'owner',
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
                html: `<h1>Bienvenue ${request.ownerName} !</h1><p>Votre espace a été configuré.</p>`,
            });
        }
    } catch (authErr) {
        logger.error('[MCC/prov] Échec création Firebase Auth Owner', authErr);
        throw authErr;
    }
}
