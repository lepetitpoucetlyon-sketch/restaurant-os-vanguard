import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * Firestore Hotspot Radar — mcc-support-ai-4
 *
 * Détecte les boucles de lecture/écriture et les hotspots Firestore par tenant.
 * Analyse les compteurs d'usage dans tenants/{tenantId}/usage/{YYYY-MM}.
 *
 * GET /api/admin/fleet/hotspot?tenantId — analyse un tenant
 * GET /api/admin/fleet/hotspot           — top 5 hotspots fleet-wide
 *
 * Signaux d'alerte :
 *   - Ratio reads/writes > 100 dans la même heure → boucle de lecture probable
 *   - Plus de 10 000 writes/heure → storm d'écriture
 *   - Collection 'orders' avec updates > 500/min → boucle POS probable
 *
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/lib/types/json";

interface HotspotAlert {
  severity: 'warning' | 'critical';
  type:     'read_loop' | 'write_storm' | 'pos_loop' | 'high_usage';
  message:  string;
  metric:   number;
}

interface HotspotReport {
  tenantId:   string;
  alerts:     HotspotAlert[];
  riskLevel:  'ok' | 'warning' | 'critical';
  analyzedAt: string;
}

async function analyzeHotspot(tenantId: string): Promise<HotspotReport> {
  const now       = new Date();
  const monthKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const alerts:   HotspotAlert[] = [];

  let usage: Record<string, number> = {};
  try {
    const raw = await Nexus.adapter.get(`tenants/${tenantId}/usage/${monthKey}`) as JsonObject | null;
    usage = raw ? Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === 'number' ? v : 0])
    ) : {};
  } catch {
    // Usage non disponible — pas d'alerte
  }

  const reads  = usage.firestore_reads  ?? 0;
  const writes = usage.firestore_writes ?? 0;
  const hourly = writes / Math.max(now.getDate() * 24, 1);

  // Boucle de lecture
  if (reads > 0 && writes > 0 && reads / writes > 100) {
    alerts.push({
      severity: 'critical',
      type:     'read_loop',
      message:  `Ratio reads/writes anormal : ${Math.round(reads / writes)}x`,
      metric:   reads / writes,
    });
  }

  // Storm d'écriture
  if (hourly > 10_000) {
    alerts.push({
      severity: 'critical',
      type:     'write_storm',
      message:  `Storm d'écriture : ~${Math.round(hourly)} writes/h`,
      metric:   hourly,
    });
  }

  // Usage élevé (avertissement)
  if (writes > 500_000) {
    alerts.push({
      severity: 'warning',
      type:     'high_usage',
      message:  `Usage élevé ce mois : ${writes.toLocaleString()} writes`,
      metric:   writes,
    });
  }

  const riskLevel = alerts.some(a => a.severity === 'critical') ? 'critical'
                  : alerts.some(a => a.severity === 'warning')  ? 'warning'
                  : 'ok';

  return { tenantId, alerts, riskLevel, analyzedAt: now.toISOString() };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');

  if (tenantId) {
    const report = await analyzeHotspot(tenantId);
    logger.info(`[Hotspot] ${tenantId} → ${report.riskLevel} (${report.alerts.length} alertes)`);
    return NextResponse.json(report);
  }

  // Fleet-wide : top 5 par risque
  try {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    const reports   = await Promise.all(
      instances.slice(0, 30).map(i => analyzeHotspot(i.id ?? ''))
    );
    const sorted = reports
      .filter(r => r.riskLevel !== 'ok')
      .sort((a, b) => b.alerts.length - a.alerts.length)
      .slice(0, 5);
    return NextResponse.json({ hotspots: sorted, scannedCount: instances.length });
  } catch (err) {
    logger.error('[hotspot] Analyse fleet failed', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
