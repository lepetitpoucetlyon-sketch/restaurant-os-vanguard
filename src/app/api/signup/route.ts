import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { ProvisioningEngine } from '@/domain/services/ProvisioningEngine';
import { BrandingService } from '@/domain/services/BrandingService';
import { BillingService } from '@/domain/services/BillingService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { getRateLimiter } from '@/lib/rate-limiter';

const SignupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  restaurantName: z.string().min(2).max(80),
  siret: z.string().max(20).optional(),
  websiteUrl: z.string().url().max(2048).optional().or(z.literal('')),
});

function toTenantKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/**
 * Résout un tenantId LIBRE. Un slug déjà pris ne doit JAMAIS être réutilisé :
 * sinon le nouveau compte reçoit des claims `{tenantId: <existant>, role: admin}`
 * et devient admin du tenant d'autrui (TenantSeeder étant idempotent, il skip
 * et la prise de contrôle passe inaperçue).
 */
async function resolveFreeTenantId(base: string): Promise<string> {
  const root = base || 'resto';
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${crypto.randomUUID().slice(0, 6)}`;
    const existing = await Nexus.adapter.get(`tenants/${candidate}/tenantConfig`);
    if (!existing) return candidate;
    logger.warn(`[signup] tenantId collision on "${candidate}" — retrying`);
  }
  throw new Error('TENANT_ID_ALLOCATION_FAILED');
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limiter = getRateLimiter();
  const rateLimitResult = await limiter.check(`signup:${ip}`, 3, 60 * 60 * 1000); // 3/heure
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
  }
  const parsed = SignupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Champs invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { email, password, restaurantName, siret: _siret, websiteUrl } = parsed.data;

  initFirebaseAdmin();

  // Tenant résolu AVANT toute création — garantit qu'on ne s'accroche jamais
  // aux claims d'un tenant existant.
  let tenantId: string;
  try {
    tenantId = await resolveFreeTenantId(toTenantKey(restaurantName));
  } catch (err) {
    logger.error('[signup] Tenant allocation failed', String(err));
    return NextResponse.json({ error: 'Impossible d\'allouer un identifiant' }, { status: 500 });
  }

  // 1. Firebase Auth — create user
  let uid: string;
  try {
    const userRecord = await getAuth().createUser({ email, password, displayName: restaurantName });
    uid = userRecord.uid;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('[signup] createUser failed', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    // 2. Custom claims — TOUTE la sécurité serveur en dépend :
    //    firestore.rules lit request.auth.token.tenantId/role,
    //    adminAuthGuard lit role/tenantId. `clientId` = alias historique.
    await getAuth().setCustomUserClaims(uid, {
      tenantId,
      clientId: tenantId,
      role: 'admin',
    });

    // 3. Optional brand extraction from URL
    let primaryColor: string | undefined;
    if (websiteUrl) {
      try {
        const brand = await BrandingService.extractFromUrl(websiteUrl);
        primaryColor = brand.primaryColor;
      } catch (err) {
        logger.warn('[signup] BrandingService.extractFromUrl failed — continuing without branding', String(err));
      }
    }

    // 4. Provision instance (registers in fleet + seeds tenant data)
    await ProvisioningEngine.provisionNewInstance({
      key: tenantId,
      name: restaurantName,
      ownerEmail: email,
      initialPrimaryColor: primaryColor,
      tier: 'STANDARD',
      copyBaseTemplates: true,
    });

    logger.info(`[signup] New tenant provisioned: ${tenantId} (uid=${uid})`);

    // 5. Create Stripe Checkout session for initial subscription
    const origin = req.headers.get('origin') ?? 'https://app.nexus-fleet.io';
    let checkoutUrl: string | null = null;
    try {
      const checkout = await BillingService.createCheckoutSession({
        tenantId,
        email,
        tier: 'STANDARD',
        successUrl: `${origin}/?tenant=${tenantId}&checkout=success`,
        cancelUrl: `${origin}/signup?checkout=cancelled`,
      });
      checkoutUrl = checkout.url;
    } catch (err) {
      logger.warn('[signup] Stripe checkout creation failed — tenant can pay later', String(err));
    }

    return NextResponse.json({ tenantId, uid, checkoutUrl }, { status: 201 });

  } catch (err: unknown) {
    // Rollback : un user Firebase sans tenant provisionné est un orphelin
    // qui pollue l'auth et peut bloquer un futur signup avec le même email.
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[signup] Provisioning failed — rolling back auth user', message);
    try {
      await getAuth().deleteUser(uid);
    } catch (rollbackErr) {
      logger.error('[signup] Rollback deleteUser failed — orphan user', String(rollbackErr));
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
