import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withPublicRoute } from '@/lib/server/routeWrapper';
import { getStripe } from '@/lib/payments/stripeClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";
import { FiscalSealer } from "@/modules/finance";
import { CryptoService } from "@/lib/CryptoService";

const ActionSetupSchema = z.object({
  action: z.literal('setup'),
  reservationId: z.string().min(1),
  tenantId: z.string().min(1),
  covers: z.number().int().min(1),
});

const ActionConfirmSchema = z.object({
  action: z.literal('confirm'),
  reservationId: z.string().min(1),
  tenantId: z.string().min(1),
  stripePaymentMethodId: z.string().min(1),
  stripeCustomerId: z.string().optional(),
});

const ActionChargeSchema = z.object({
  action: z.literal('charge'),
  reservationId: z.string().min(1),
  tenantId: z.string().min(1),
});

const BodySchema = z.discriminatedUnion('action', [
  ActionSetupSchema,
  ActionConfirmSchema,
  ActionChargeSchema,
]);

function getConfiguredStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return getStripe(key); // fabrique centralisée (timeout+retries, audit S10)
}

export const POST = withPublicRoute(async (request) => {
  try {
    const rawBody = await request.json();
    const parsed = BodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // 1. ACTION: SETUP
    if (data.action === 'setup') {
      const { reservationId, tenantId, covers } = data;

      const rawTenant = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
      const resaConfig = (rawTenant as JsonObject | null)?.reservationConfig as JsonObject | undefined;

      const imprintEnabled = resaConfig?.cardImprintEnabled === true;
      const penaltyAmount = (resaConfig?.cardImprintPenaltyAmount as number | undefined) ?? 20;

      if (!imprintEnabled) {
        return NextResponse.json({ required: false });
      }

      const stripe = getConfiguredStripe();
      const setupIntent = await stripe.setupIntents.create({
        usage: 'off_session',
        metadata: {
          tenantId,
          reservationId,
          covers: String(covers),
        },
      });

      return NextResponse.json({
        required: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        penaltyAmount,
      });
    }

    // 2. ACTION: CONFIRM
    if (data.action === 'confirm') {
      const { reservationId, tenantId, stripePaymentMethodId, stripeCustomerId } = data;
      const resPath = `tenants/${tenantId}/reservations/${reservationId}`;

      await Nexus.adapter.update(resPath, {
        cardImprintStatus: 'collected',
        stripePaymentMethodId,
        stripeCustomerId: stripeCustomerId ?? null,
        cardImprintCollectedAt: new Date().toISOString(),
      });

      empireAudit.log({
        module: 'finance',
        action: 'CARD_IMPRINT_COLLECTED',
        details: { reservationId, tenantId, stripePaymentMethodId },
        severity: 'low',
        timestamp: new Date(),
      });

      return NextResponse.json({ success: true, status: 'collected' });
    }

    // 3. ACTION: CHARGE (CRON / SERVER-TO-SERVER)
    if (data.action === 'charge') {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }

      const { reservationId, tenantId } = data;
      const resPath = `tenants/${tenantId}/reservations/${reservationId}`;
      const reservation = await Nexus.adapter.get<Record<string, unknown>>(resPath);

      if (!reservation) {
        return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
      }

      if (reservation.status !== 'no_show') {
        return NextResponse.json({ error: 'Seules les réservations en no-show peuvent être prélevées' }, { status: 400 });
      }

      if (reservation.cardImprintStatus !== 'collected' || !reservation.stripePaymentMethodId) {
        return NextResponse.json({ error: 'Pas d\'empreinte bancaire valide collectée' }, { status: 400 });
      }

      const rawTenant = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
      const resaConfig = (rawTenant as JsonObject | null)?.reservationConfig as JsonObject | undefined;
      const penaltyEur = (resaConfig?.cardImprintPenaltyAmount as number | undefined) ?? 20;
      const amountInCents = penaltyEur * 100;

      const stripe = getConfiguredStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        customer: (reservation.stripeCustomerId as string) ?? undefined,
        payment_method: reservation.stripePaymentMethodId as string,
        off_session: true,
        confirm: true,
        description: `Pénalité No-Show Réservation ${reservationId}`,
        metadata: {
          tenantId,
          reservationId,
          type: 'no_show_penalty',
        },
      });

      const chargedAmountInMicrounits = penaltyEur * 1_000_000;
      const entryId = `JOURNAL-NOSHOW-${reservationId}`;

      // Lot 3 nouveau plan — Écriture comptable NF525 SCELLÉE via le sceau atomique.
      // Auparavant : Nexus.adapter.set direct sur journalEntries + update séparé (2 pièces,
      // pas de sceau, pas de chain-continuité). Maintenant : une seule transaction qui
      // pose la pièce + le sceau chaîné + met à jour la réservation.
      const journalEntry = {
        id: entryId,
        tenantId,
        type: 'NF525_NO_SHOW_PENALTY',
        accountCode: '758000',
        amountInMicrounits: chargedAmountInMicrounits,
        referenceId: reservationId,
        description: `Pénalité No-Show réservataire ${reservation.customerName || reservationId}`,
        createdAt: new Date().toISOString(),
      };
      const dataSnapshot = CryptoService.canonicalStringify(journalEntry);
      const seal = await FiscalSealer.sealDataAtomically(
        dataSnapshot,
        tenantId,
        false,
        journalEntry,
        (tx) => {
          tx.set(resPath, {
            cardImprintStatus: 'charged',
            stripePaymentIntentId: paymentIntent.id,
            chargedAmountInMicrounits,
            chargedAt: new Date().toISOString(),
            nf525EntryId: entryId,
            nf525SealId: null, // sera renseigné après commit
          });
        }
      );
      // Second update : lier le sealId à la réservation (idempotent)
      await Nexus.adapter.update(resPath, { nf525SealId: seal.sealId });

      empireAudit.log({
        module: 'finance',
        action: 'NO_SHOW_CHARGE_SUCCESS',
        details: { reservationId, tenantId, amountInCents, stripePaymentIntentId: paymentIntent.id },
        severity: 'high',
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        status: 'charged',
        paymentIntentId: paymentIntent.id,
        amountEur: penaltyEur,
      });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (err) {
    logger.error('[card-imprint/route]', err);
    return NextResponse.json({ error: 'Erreur serveur lors du traitement de l\'empreinte bancaire' }, { status: 500 });
  }
});

