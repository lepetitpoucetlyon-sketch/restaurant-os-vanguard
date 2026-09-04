import 'server-only';
// Vercel Cron: schedule: "0 8 * * 1" (chaque lundi à 8h)
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildWeeklyReportHTML } from '@/modules/intelligence';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { isAuthorizedCronRequest } from '@/lib/server/cronAuth';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'rapports@restaurant-os.app';

interface TenantSettings {
  contact?: {
    emailGeneral?: string;
  };
}

/**
 * GET /api/cron/weekly-report
 *
 * Protected by Vercel's `Authorization: Bearer $CRON_SECRET` contract.
 *
 * Builds the HTML report for the previous week and sends it via Resend
 * to the tenant owner's email address (settings/general → contact.emailGeneral).
 */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Date range: previous Monday → previous Sunday ─────────────────────────
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon …
  const daysToLastMonday = currentDay === 0 ? 6 : currentDay - 1;

  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  // ── Send via Resend ───────────────────────────────────────────────────────
  if (!resend) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured' },
      { status: 500 }
    );
  }

  // ── Multi-tenant iteration ────────────────────────────────────────────────
  const { Nexus } = await import('@/lib/nexus/NexusAdapter');

  // Récupérer la liste de tous les tenants actifs
  const allTenants = await Nexus.adapter.query<{ id?: string; status?: string }>(
    'tenants',
    { where: [{ field: 'status', operator: '==', value: 'active' }] }
  ).catch(() => [] as Array<{ id?: string; status?: string }>);

  // Fallback : si aucun tenant trouvé, utiliser le tenant par défaut (REPORT_EMAIL)
  if (allTenants.length === 0) {
    const fallbackEmail = process.env.REPORT_EMAIL;
    if (!fallbackEmail) {
      return NextResponse.json(
        { error: 'No tenants found and no REPORT_EMAIL configured' },
        { status: 400 }
      );
    }
    const html = await buildWeeklyReportHTML(lastMonday.getTime(), lastSunday.getTime());
    const subject = `Rapport Hebdomadaire — ${lastMonday.toLocaleDateString('fr-FR')} au ${lastSunday.toLocaleDateString('fr-FR')}`;
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to: fallbackEmail, subject, html });
    if (error) {
      logger.error('[WeeklyReport] Resend send failed', error);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi du rapport' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sentTo: fallbackEmail });
  }

  const results: Array<{ tenantId: string; sentTo?: string; error?: string }> = [];

  for (const tenant of allTenants) {
    const tenantId = tenant.id;
    if (!tenantId) continue;

    try {
      const settings = await Nexus.adapter
        .get<TenantSettings>(`tenants/${tenantId}/settings/general`)
        .catch(() => null);

      const ownerEmail = settings?.contact?.emailGeneral ?? process.env.REPORT_EMAIL;
      if (!ownerEmail) {
        logger.warn(`[WeeklyReport] Tenant ${tenantId} : pas d'email configuré, rapport ignoré.`);
        results.push({ tenantId, error: 'no_email' });
        continue;
      }

      const html = await buildWeeklyReportHTML(lastMonday.getTime(), lastSunday.getTime());
      const subject = `Rapport Hebdomadaire — ${lastMonday.toLocaleDateString('fr-FR')} au ${lastSunday.toLocaleDateString('fr-FR')}`;

      const { error } = await resend.emails.send({ from: FROM_EMAIL, to: ownerEmail, subject, html });
      if (error) {
        logger.error(`[WeeklyReport] Resend failed for tenant ${tenantId}`, error);
        results.push({ tenantId, error: 'send_failed' });
      } else {
        results.push({ tenantId, sentTo: ownerEmail });
      }
    } catch (err) {
      logger.error(`[WeeklyReport] Error processing tenant ${tenantId}`, toError(err).message);
      results.push({ tenantId, error: toError(err).message });
    }
  }

  const sent = results.filter(r => r.sentTo);
  const failed = results.filter(r => r.error);
  return NextResponse.json({ ok: true, sent: sent.length, failed: failed.length, details: results });
}
