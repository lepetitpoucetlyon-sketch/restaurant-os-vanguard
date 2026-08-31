import 'server-only';
// PUBLIC ROUTE — no auth by design (B2C signup flow).
// Protection: rate-limit + Zod validation (voir handler POST).
// Contradiction MCC-only à vérifier périodiquement selon décision produit.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import { ProvisioningEngine } from '@/lib/ProvisioningEngine';
import { BrandingService } from '@/lib/BrandingService';
 
import { BillingService } from '@/modules/finance';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { sendEmail } from '@/lib/email-service';
import { PlatformVariantSchema } from '@/modules/system';
import { toError } from "@/lib/toError";

const SignupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  businessName: z.string().min(2).max(80),
  variant: PlatformVariantSchema.default('restaurant'),
  siret: z.string().max(20).optional(),
  websiteUrl: z.string().url().max(2048).optional().or(z.literal('')),
});

function welcomeEmailHtml(businessName: string, tenantId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.restaurant-os.app';
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:40px auto;padding:40px 32px;background:#161618;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;margin-bottom:24px;display:flex;align-items:center;justify-content:center">
      <span style="color:white;font-size:22px">🚀</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f8fafc">Bienvenue sur Restaurant OS</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px">Votre restaurant <strong style="color:#e2e8f0">${businessName}</strong> est prêt.</p>
    <a href="${appUrl}/pos" style="display:inline-block;background:#6366f1;color:white;font-weight:700;font-size:13px;padding:12px 24px;border-radius:10px;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
      Accéder au tableau de bord →
    </a>
    <hr style="margin:32px 0;border:none;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="margin:0 0 8px;font-size:12px;color:#475569"><strong>Vos identifiants</strong></p>
    <p style="margin:0 0 4px;font-size:12px;color:#475569">Identifiant restaurant : <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;font-size:11px">${tenantId}</code></p>
    <p style="margin:24px 0 0;font-size:11px;color:#334155">Restaurant OS · Système d'exploitation pour la restauration · <a href="${appUrl}/legal" style="color:#6366f1;text-decoration:none">Mentions légales</a></p>
  </div>
</body></html>`;
}

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
  const { email, password, businessName, variant, siret: _siret, websiteUrl } = parsed.data;

  const authProvider = getServerAuthProvider();

  // Tenant résolu AVANT toute création — garantit qu'on ne s'accroche jamais
  // aux claims d'un tenant existant.
  let tenantId: string;
  try {
    tenantId = await resolveFreeTenantId(toTenantKey(businessName));
  } catch (err) {
    logger.error('[signup] Tenant allocation failed', toError(err).message);
    return NextResponse.json({ error: 'Impossible d\'allouer un identifiant' }, { status: 500 });
  }

  // 1. Firebase Auth — create user
  let uid: string;
  try {
    const userRecord = await authProvider.createUser({ email, password, displayName: businessName });
    uid = userRecord.uid;
  } catch (err) {
    const message = toError(err).message;
    logger.warn('[signup] createUser failed', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    // 2. Custom claims — TOUTE la sécurité serveur en dépend :
    //    firestore.rules lit request.auth.token.tenantId/role,
    //    adminAuthGuard lit role/tenantId. `clientId` = alias historique.
    await authProvider.setCustomClaims(uid, {
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
        logger.warn('[signup] BrandingService.extractFromUrl failed — continuing without branding', toError(err).message);
      }
    }

    // 4. Provision instance (registers in fleet + seeds tenant data)
    await ProvisioningEngine.provisionNewInstance({
      key: tenantId,
      name: businessName,
      ownerEmail: email,
      variant,
      initialPrimaryColor: primaryColor,
      tier: 'STANDARD',
      copyBaseTemplates: true,
    });

    logger.info(`[signup] New tenant provisioned: ${tenantId} (uid=${uid})`);

    // inf-1 — Email de bienvenue (fire-and-forget, ne bloque pas la réponse)
    sendEmail({
      to: email,
      subject: `Bienvenue sur Restaurant OS — ${businessName}`,
      html: welcomeEmailHtml(businessName, tenantId),
    }).catch(err => logger.warn('[signup] Welcome email failed', toError(err).message));

    // 5. Create Stripe Checkout session for initial subscription
    const origin = req.headers.get('origin') ?? 'https://app.nexus-fleet.io';
    let checkoutUrl: string | null = null;
    try {
      const checkout = await BillingService.createCheckoutSession({
        tenantId,
        email,
        tier: 'STANDARD',
        successUrl: `${origin}/welcome?tenant=${tenantId}&checkout=success`,
        cancelUrl: `${origin}/signup?checkout=cancelled`,
      });
      checkoutUrl = checkout.url;
    } catch (err) {
      logger.warn('[signup] Stripe checkout creation failed — tenant can pay later', toError(err).message);
    }

    return NextResponse.json({ tenantId, uid, checkoutUrl }, { status: 201 });

  } catch (err) {
    // Rollback : un user Firebase sans tenant provisionné est un orphelin
    // qui pollue l'auth et peut bloquer un futur signup avec le même email.
    const message = toError(err).message;
    logger.error('[signup] Provisioning failed — rolling back auth user', message);
    try {
      await authProvider.deleteUser(uid);
    } catch (rollbackErr) {
      logger.error('[signup] Rollback deleteUser failed — orphan user', String(rollbackErr));
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
