/**
 * POST /api/hr/dsn    — générer + soumettre + archiver la DSN mensuelle
 * GET  /api/hr/dsn    — lister les DSN archivées
 *
 * Body POST : { period: "2026-07" }
 *
 * Flux :
 *   1. DSNBuilder.generate() → XML DSN phase 3
 *   2. DSNBuilder.submit()   → POST net-entreprises.fr (si URSSAF_API_KEY)
 *   3. DSNBuilder.archive()  → Nexus tenants/{tenantId}/dsn/{period}
 *
 * Protégé : requireTenantAdmin.
 * ENV : URSSAF_API_KEY (optionnel — sans clé, mode simulation)
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { DSNBuilder } from '@/src/modules/human/remuneration/payroll/DSNBuilder';;
import { Nexus } from '@/lib/nexus/NexusAdapter';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const body = await req.json() as { period?: string };
  const period = body.period?.trim();

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period requis au format YYYY-MM' }, { status: 400 });
  }

  // Vérifier qu'une DSN n'a pas déjà été soumise pour cette période
  const existing = await Nexus.adapter.get(`tenants/${tenantId}/dsn/${period}`) as { submittedAt?: number } | null;
  if (existing?.submittedAt) {
    return NextResponse.json({ error: `DSN déjà soumise pour ${period}` }, { status: 409 });
  }

  const decl = await DSNBuilder.generate(tenantId, period);
  const { submitted, reference } = await DSNBuilder.submit(decl);
  await DSNBuilder.archive({ ...decl, submittedAt: submitted ? Date.now() : null }, reference);

  return NextResponse.json({
    period,
    employeeCount: decl.employeeCount,
    grossWageTotal: decl.grossWageTotal,
    socialContribTotal: decl.socialContribTotal,
    submitted,
    reference: reference ?? null,
    mode: submitted ? 'live' : 'simulation',
  }, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const docs = await Nexus.adapter.query(`tenants/${tenantId}/dsn`, {
    orderBy: { field: 'period', direction: 'desc' },
    limit: 24,
  });

  return NextResponse.json({ declarations: docs });
}
