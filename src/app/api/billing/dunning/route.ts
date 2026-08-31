/**
 * POST /api/billing/dunning
 * Moteur de dunning progressif — à appeler par un cron Vercel (vercel.json crons).
 * Protégé par INTERNAL_API_SECRET.
 *
 * Avancement des steps :
 *   step 0 → 1 (J+3)  : relance email, billing.status = 'past_due_grace'
 *   step 1 → 2 (J+7)  : suspension, billing.status = 'suspended'
 *   step 2 → 3 (J+14) : verrouillage, billing.status = 'LOCKED', licenceStatus = 'LOCKED'
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';
import { toError } from "@/lib/toError";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';

interface DunningRecord {
  tenantId: string;
  dueAt: string;
  step: number;
  nextActionAt: string;
  resolved?: boolean;
}

async function sendDunningEmail(to: string, tenantName: string, step: number) {
  if (!resend || !to) return;
  const messages = [
    { subject: 'Rappel : paiement en attente', body: 'Un paiement est en attente pour votre abonnement Restaurant OS. Veuillez régulariser sous 4 jours pour éviter une suspension.' },
    { subject: 'Suspension imminente de votre compte', body: 'Votre compte sera suspendu dans 7 jours si le paiement n\'est pas reçu. Contactez le support ou mettez à jour votre moyen de paiement.' },
    { subject: 'Compte verrouillé — action requise', body: 'Votre accès Restaurant OS a été verrouillé suite à un impayé. Contactez le support pour réactiver.' },
  ];
  const msg = messages[step] ?? messages[0];
  await resend.emails.send({
    from: FROM, to,
    subject: `[Restaurant OS] ${msg.subject}`,
    html: `<p>Bonjour ${tenantName},</p><p>${msg.body}</p><p style="color:#888;font-size:11px;">Restaurant OS Billing</p>`,
  }).catch(e => logger.warn('[Dunning] email error:', toError(e).message));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || req.headers.get('x-internal-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();

  try {
    const records = await Nexus.adapter.query<DunningRecord>('mcc/dunning');
    const pending  = records.filter(r => !r.resolved && new Date(r.nextActionAt).getTime() <= now);

    let processed = 0;

    for (const record of pending) {
      const { tenantId, step } = record;
      const configPath = `tenants/${tenantId}/tenantConfig`;

      try {
        const config = await Nexus.adapter.get(configPath) as {
          contactEmail?: string; name?: string;
        } | null;
        const email = config?.contactEmail ?? '';
        const name  = config?.name ?? tenantId;

        if (step === 0) {
          // J+3 — relance
          await Nexus.adapter.set(configPath, {
            billing: { status: 'past_due_grace' },
            status: { economy: { billingStatus: 'past_due_grace' } },
          }, { merge: true });
          await Nexus.adapter.set(`mcc/dunning/${tenantId}`, {
            step: 1,
            nextActionAt: new Date(now + 4 * 86400_000).toISOString(),
          }, { merge: true });
          await sendDunningEmail(email, name, 0);
          logger.warn(`[Dunning] ${tenantId} → step 1 (relance J+3)`);

        } else if (step === 1) {
          // J+7 — suspension
          await Nexus.adapter.set(configPath, {
            billing: { status: 'suspended' },
            status: { economy: { billingStatus: 'suspended' }, maintenanceMode: true },
          }, { merge: true });
          await Nexus.adapter.set(`mcc/dunning/${tenantId}`, {
            step: 2,
            nextActionAt: new Date(now + 7 * 86400_000).toISOString(),
          }, { merge: true });
          await sendDunningEmail(email, name, 1);
          logger.warn(`[Dunning] ${tenantId} → step 2 (suspension J+7)`);

        } else if (step === 2) {
          // J+14 — LOCKED
          await Nexus.adapter.set(configPath, {
            billing: { status: 'LOCKED' },
            status: { economy: { billingStatus: 'LOCKED' }, licenceStatus: 'LOCKED', maintenanceMode: false },
          }, { merge: true });
          await Nexus.adapter.set(`mcc/dunning/${tenantId}`, {
            step: 3,
            resolved: true,
          }, { merge: true });
          await sendDunningEmail(email, name, 2);
          logger.warn(`[Dunning] ${tenantId} → LOCKED (J+14)`);
        }

        processed++;
      } catch (err) {
        logger.error(`[Dunning] Erreur tenant ${tenantId}:`, toError(err).message);
      }
    }

    return NextResponse.json({ success: true, processed, checked: pending.length });

  } catch (err) {
    logger.error('[Dunning] Erreur globale', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
