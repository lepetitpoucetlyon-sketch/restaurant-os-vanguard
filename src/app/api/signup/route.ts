import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from '@/lib/firebase-admin-init';
import { ProvisioningEngine } from '@/domain/services/ProvisioningEngine';
import { BrandingService } from '@/domain/services/BrandingService';
import { BillingService } from '@/domain/services/BillingService';
import { logger } from '@/lib/logger';

function toTenantKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  const { email, password, restaurantName, siret: _siret, websiteUrl } = await req.json();

  if (!email || !password || !restaurantName) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  initFirebaseAdmin();

  try {
    // 1. Firebase Auth — create user
    const userRecord = await getAuth().createUser({ email, password, displayName: restaurantName });

    // 2. Determine tenant key
    const tenantId = toTenantKey(restaurantName);

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

    logger.info(`[signup] New tenant provisioned: ${tenantId} (uid=${userRecord.uid})`);

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

    return NextResponse.json({ tenantId, uid: userRecord.uid, checkoutUrl }, { status: 201 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[signup] Provisioning failed', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
