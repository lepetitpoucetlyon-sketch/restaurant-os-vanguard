import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * GET /api/admin/fleet/billing/treasury-report
 *
 * Retourne le rapport financier réel de la flotte MCC.
 * Source : Stripe API si STRIPE_SECRET_KEY est défini, sinon estimation Firestore.
 *
 * POST /api/admin/fleet/billing/treasury-report
 * Génère un rapport consolidé cross-tenant (cron/weekly) et le persiste.
 *
 * Protégé : fleet_admin minimum.
 */
import { NextRequest, NextResponse } from 'next/server';
 
import { BillingService } from '@/modules/finance';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const report = await BillingService.getFleetTreasuryReport();
  return NextResponse.json(report);
}

interface TenantSummary {
  tenantId: string;
  healthScore: number | null;
  complianceStatus: string;
  billingStatus: string;
  billingPlan: string;
}

/**
 * POST — Cron aggregation: consolidates revenue, health, and compliance
 * across all tenants into a weekly fleet report.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  try {
    // 1. Retrieve all tenants
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;

    // 2. Aggregate per-tenant data
    const tenantSummaries: TenantSummary[] = [];
    let totalHealthScore = 0;
    let tenantsWithHealth = 0;
    let compliantCount = 0;
    let activeCount = 0;

    await Promise.all(
      instances.map(async (inst) => {
        const tid = inst.id ?? '';
        if (!tid) return;

        const [config, haccpAlerts] = await Promise.allSettled([
          Nexus.adapter.get(`tenants/${tid}/tenantConfig`) as Promise<{
            healthScore?: number;
            healthComputedAt?: string;
            billing?: { status?: string; plan?: string };
          } | null>,
          Nexus.adapter.query(`tenants/${tid}/haccpAlerts`) as Promise<Array<{ resolved?: boolean }>>,
        ]);

        const cfg = config.status === 'fulfilled' ? config.value : null;
        const haccp = haccpAlerts.status === 'fulfilled' ? haccpAlerts.value : [];
        const openAlerts = haccp.filter(a => !a.resolved).length;
        const complianceStatus = openAlerts === 0 ? 'compliant' : openAlerts <= 3 ? 'at_risk' : 'non_compliant';
        const healthScore = cfg?.healthScore ?? null;
        const billingStatus = cfg?.billing?.status ?? 'unknown';
        const billingPlan = cfg?.billing?.plan ?? 'unknown';

        if (healthScore !== null) {
          totalHealthScore += healthScore;
          tenantsWithHealth++;
        }
        if (complianceStatus === 'compliant') compliantCount++;
        if (billingStatus === 'ACTIVE') activeCount++;

        tenantSummaries.push({ tenantId: tid, healthScore, complianceStatus, billingStatus, billingPlan });
      })
    );

    // 3. Get financial report from Stripe / theoretical
    const treasury = await BillingService.getFleetTreasuryReport();

    // 4. Build consolidated report
    const dateStr = new Date().toISOString().slice(0, 10);
    const consolidatedReport = {
      generatedAt: new Date().toISOString(),
      period: `weekly-${dateStr}`,
      fleet: {
        totalTenants: instances.length,
        activeTenants: activeCount,
        averageHealthScore: tenantsWithHealth > 0
          ? Math.round(totalHealthScore / tenantsWithHealth)
          : null,
        compliantTenants: compliantCount,
        complianceRate: instances.length > 0
          ? Math.round((compliantCount / instances.length) * 100)
          : 0,
      },
      revenue: {
        mrr: treasury.mrr,
        collectedMtd: treasury.collectedMtd,
        activeSubscriptions: treasury.activeSubscriptions,
        churnLast30Days: treasury.churnLast30Days,
        source: treasury.source,
      },
      tenants: tenantSummaries,
    };

    // 5. Persist to mcc/fleet-reports/
    await Nexus.adapter.set(`mcc/fleet-reports/weekly-${dateStr}`, consolidatedReport);

    logger.info(
      `[FleetReport] Weekly report generated — ${instances.length} tenants, MRR=${treasury.mrr}, health_avg=${consolidatedReport.fleet.averageHealthScore}`
    );

    return NextResponse.json(consolidatedReport, { status: 201 });
  } catch (err) {
    logger.error('[FleetReport] Weekly aggregation failed', err);
    return NextResponse.json({ error: 'Erreur generation rapport' }, { status: 500 });
  }
}
