// Vercel Cron: schedule: "0 8 * * 1" (chaque lundi à 8h)
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildWeeklyReportHTML } from '@/lib/reports/weeklyReport';

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
 * Protected by CRON_SECRET.  Vercel passes the secret via the
 * `x-vercel-cron-signature` header; for local testing pass it via
 * `x-cron-secret`.
 *
 * Builds the HTML report for the previous week and sends it via Resend
 * to the tenant owner's email address (settings/general → contact.emailGeneral).
 */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const incomingSecret =
    req.headers.get('x-vercel-cron-signature') ??
    req.headers.get('x-cron-secret');

  if (!incomingSecret || incomingSecret !== process.env.CRON_SECRET) {
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

  // ── Build report ──────────────────────────────────────────────────────────
  const html = await buildWeeklyReportHTML(
    lastMonday.getTime(),
    lastSunday.getTime()
  );

  // ── Resolve owner email from Nexus settings ───────────────────────────────
  const { Nexus } = await import('@/lib/nexus/NexusAdapter');

  const settings = await Nexus.adapter
    .get<TenantSettings>('settings/general')
    .catch(() => null);

  const ownerEmail =
    settings?.contact?.emailGeneral ?? process.env.REPORT_EMAIL;

  if (!ownerEmail) {
    return NextResponse.json(
      { error: 'No owner email configured (settings/general → contact.emailGeneral or REPORT_EMAIL env)' },
      { status: 400 }
    );
  }

  // ── Send via Resend ───────────────────────────────────────────────────────
  if (!resend) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const subject = `Rapport Hebdomadaire — ${lastMonday.toLocaleDateString('fr-FR')} au ${lastSunday.toLocaleDateString('fr-FR')}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: ownerEmail });
}
