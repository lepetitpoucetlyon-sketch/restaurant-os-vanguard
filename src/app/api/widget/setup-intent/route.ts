import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantConfigSchema } from '@/src/modules/system/domain/schemas/tenant';;
import { logger } from '@/lib/logger';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { JsonObject } from "@/shared/types/json";

const QuerySchema = z.object({
  tenantId: z.string().min(1).max(80),
  covers: z.coerce.number().int().min(1).max(100).optional().default(1),
});

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const rl = await getRateLimiter().check(`widget:setup-intent:${ip}`, 5, 60 * 60 * 1000); // 5/heure — crée des objets Stripe
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes — réessayez dans 1h.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      tenantId: searchParams.get('tenantId'),
      covers: searchParams.get('covers'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const { tenantId, covers } = parsed.data;

    // Load tenant config to check imprint conditions
    const raw = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
    if (!raw) return NextResponse.json({ error: 'Tenant inconnu' }, { status: 404 });

    const tenantParsed = TenantConfigSchema.safeParse(raw);
    const resaConfig = tenantParsed.success
      ? (tenantParsed.data as JsonObject).reservationConfig as JsonObject | undefined
      : undefined;

    const imprintEnabled = resaConfig?.cardImprintEnabled === true;
    const condition = (resaConfig?.cardImprintCondition as string | undefined) ?? 'group';
    const groupMin = (resaConfig?.cardImprintGroupMin as number | undefined) ?? 5;

    // Evaluate whether imprint is required for this booking
    let required = false;
    if (imprintEnabled) {
      if (condition === 'always') required = true;
      else if (condition === 'group' && covers >= groupMin) required = true;
      else if (condition === 'privatization') required = false; // handled separately
      // 'amount' condition is checked at booking time against deposit amount
    }

    if (!required) {
      return NextResponse.json({ required: false });
    }

    // Create Stripe SetupIntent
    const setupIntent = await getStripe().setupIntents.create({
      usage: 'off_session',
      metadata: { tenantId, covers: String(covers) },
    });

    logger.info(`[widget/setup-intent] Created SetupIntent ${setupIntent.id} for tenant ${tenantId}`);

    return NextResponse.json({
      required: true,
      clientSecret: setupIntent.client_secret,
      penaltyAmount: (resaConfig?.cardImprintPenaltyAmount as number | undefined) ?? 20,
      cancelHours: (resaConfig?.cardImprintCancelHours as number | undefined) ?? 24,
    });
  } catch (err) {
    logger.error('[widget/setup-intent]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
