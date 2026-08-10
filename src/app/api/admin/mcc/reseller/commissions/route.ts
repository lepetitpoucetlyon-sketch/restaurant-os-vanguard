import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * POST /api/admin/mcc/reseller/commissions
 * Calcule et archive les commissions revendeur pour un mois donné.
 *
 * Body : { period: "2026-07" }
 *
 * Calcul :
 *   Pour chaque tenant avec tenantConfig.referredBy = affiliateCode :
 *     commission = MRR_tenant × commissionRate
 *   Archivé dans mcc/resellerCommissions/{period}/{resellerId}
 *   Met à jour mcc/resellers/{id}.totalCommissionsEur
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface Reseller { id: string; affiliateCode: string; commissionRate: number; totalCommissionsEur: number }
interface TenantConfig { referredBy?: string; billing?: { mrr?: number } }

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const body = await req.json() as { period?: string };
  const period = body.period?.trim();
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: 'period requis au format YYYY-MM' }, { status: 400 });
  }

  const [resellers, tenants] = await Promise.all([
    Nexus.adapter.query('mcc/resellers', { limit: 200 }) as Promise<Reseller[]>,
    Nexus.adapter.query('tenants', { limit: 1000 }) as Promise<{ id?: string }[]>,
  ]);

  // Construire index affiliateCode → reseller
  const byCode = new Map<string, Reseller>(resellers.map(r => [r.affiliateCode, r]));

  const commissions: Record<string, { resellerId: string; reseller: string; tenantsCount: number; totalMrr: number; commission: number }> = {};

  await Promise.all(
    tenants.map(async (t) => {
      const tid = t.id ?? '';
      if (!tid) return;
      const config = await Nexus.adapter.get(`tenants/${tid}/tenantConfig`) as TenantConfig | null;
      const code = config?.referredBy;
      if (!code) return;
      const reseller = byCode.get(code);
      if (!reseller) return;
      const mrr = config?.billing?.mrr ?? 0;
      if (!commissions[reseller.id]) {
        commissions[reseller.id] = { resellerId: reseller.id, reseller: reseller.id, tenantsCount: 0, totalMrr: 0, commission: 0 };
      }
      commissions[reseller.id].tenantsCount++;
      commissions[reseller.id].totalMrr += mrr;
      commissions[reseller.id].commission += mrr * reseller.commissionRate;
    })
  );

  // Archiver et mettre à jour les totaux
  await Promise.all(
    Object.values(commissions).map(async (c) => {
      await Nexus.adapter.set(`mcc/resellerCommissions/${period}/${c.resellerId}`, { ...c, period, calculatedAt: Date.now() });
      const existing = await Nexus.adapter.get(`mcc/resellers/${c.resellerId}`) as Reseller | null;
      if (existing) {
        await Nexus.adapter.set(`mcc/resellers/${c.resellerId}`, { ...existing, totalCommissionsEur: (existing.totalCommissionsEur ?? 0) + c.commission });
      }
    })
  );

  logger.info(`[Reseller] Commissions ${period} calculées — ${Object.keys(commissions).length} revendeur(s)`);

  return NextResponse.json({
    period,
    resellerCount: Object.keys(commissions).length,
    commissions: Object.values(commissions),
  });
}
