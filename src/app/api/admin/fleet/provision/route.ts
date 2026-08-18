/**
 * POST /api/admin/fleet/provision
 * Provisionnement complet d'un nouveau tenant depuis le MCC.
 *
 * Pipeline :
 *   1. ProvisioningEngine  — Registry Nexus, DNA, vertical, branding, RAG
 *   2. setupOwnerAccount   — Firebase Auth + PIN + NF525 key + email (serveur uniquement)
 *   3. setupStripeCustomer — Stripe customer best-effort
 *
 * Protégé : super_admin MCC uniquement.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { ProvisioningEngine } from '@/lib/ProvisioningEngine';
import { setupOwnerAccount, setupStripeCustomer } from '@/lib/mcc/provisioning/steps/provisioningSteps';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type { ProvisioningRequest } from '@/lib/mcc/provisioning/types';
import type { ProvisioningDNA } from '@/shared/types/empire';
import type { PlatformVariant } from '@/modules/system';

const ProvisionBodySchema = z.object({
  name:       z.string().min(1),
  key:        z.string().min(2).regex(/^[a-z0-9-]+$/, 'slug: minuscules, chiffres, tirets uniquement'),
  ownerEmail: z.string().email(),
  ownerName:  z.string().optional(),
  variant:    z.string().optional(),
  tier:       z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']).optional().default('STANDARD'),
  trialDays:  z.number().int().min(0).optional(),
  branding: z.object({
    mode:          z.enum(['default', 'custom']).default('default'),
    accentColor:   z.string().optional(),
    logoUrl:       z.string().nullable().optional(),
    splashEnabled: z.boolean().optional(),
  }).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof ProvisionBodySchema>;
  try {
    body = ProvisionBodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { name, key, ownerEmail, ownerName, variant, tier, trialDays, branding } = body;

  try {
    // 1. Nexus/Registry — rollback géré par ProvisioningEngine en cas d'erreur
    const dna: ProvisioningDNA = {
      name,
      key,
      ownerEmail,
      tier,
      copyBaseTemplates: true,
      initialPrimaryColor: branding?.mode === 'custom' ? (branding.accentColor ?? '#C5A059') : '#C5A059',
    };
    if (variant) dna.variant = variant as PlatformVariant;
    if (trialDays !== undefined) dna.trialDays = trialDays;
    if (branding) {
      dna.branding = {
        mode:          branding.mode,
        accentColor:   branding.accentColor,
        logoUrl:       branding.logoUrl ?? null,
        splashEnabled: branding.splashEnabled ?? false,
      };
    }

    const instance = await ProvisioningEngine.provisionNewInstance(dna);

    // 2. Firebase Auth + PIN + NF525 key + email (ne peut tourner qu'en serveur)
    const ownerId = `admin_${key}`;
    const provRequest: ProvisioningRequest = {
      ownerEmail,
      ownerName:   ownerName ?? ownerEmail.split('@')[0],
      companyName: name,
      siret:       '',
      planId:      (tier === 'PREMIUM' || tier === 'ENTERPRISE') ? 'PREMIUM' : 'STANDARD',
      variant:     variant as PlatformVariant | undefined,
      branding:    { primaryColor: branding?.accentColor ?? '#C5A059' },
    };
    await setupOwnerAccount(key, ownerId, provRequest);

    // 3. Stripe — best-effort, une absence de STRIPE_SECRET_KEY est gérée dans setupStripeCustomer
    try {
      await setupStripeCustomer(key, provRequest);
    } catch (stripeErr) {
      logger.warn('[Provision] Stripe setup non critique, ignoré', { key, error: toError(stripeErr).message });
    }

    logger.info('[Provision] Tenant provisionné via MCC', { key, instanceId: instance.id });
    return NextResponse.json({ success: true, tenantId: key, instanceId: instance.id });

  } catch (err) {
    logger.error('[Provision] Échec provisionnement', { key, error: toError(err).message });
    return NextResponse.json({ error: toError(err).message }, { status: 500 });
  }
}
