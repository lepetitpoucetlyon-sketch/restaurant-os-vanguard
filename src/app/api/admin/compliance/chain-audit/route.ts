import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * Audit intégrité chaîne auto — mcc-comp-2
 *
 * Vérifie l'intégrité de la chaîne de scellement NF525 :
 * - Pour chaque JournalEntry, recompute SHA-256(dataSnapshot + previousHash)
 * - Compare avec le fiscalSeal.hash stocké
 * - Toute discordance = BREACH (sévérité critique)
 *
 * POST /api/admin/compliance/chain-audit?tenantId  — déclenche un audit complet
 * GET  /api/admin/compliance/chain-audit?tenantId  — dernier rapport d'audit
 *
 * Ce endpoint est aussi appelé par le cron hebdomadaire (x-internal-secret).
 * Protégé : mcc_support (ou x-internal-secret).
 */
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ChainAuditResult {
  tenantId:      string;
  auditId:       string;
  auditedAt:     string;
  totalEntries:  number;
  validEntries:  number;
  breaches:      Array<{ entryId: string; expectedHash: string; storedHash: string }>;
  integrity:     'OK' | 'BREACH';
}

async function runChainAudit(tenantId: string): Promise<ChainAuditResult> {
  const auditId  = crypto.randomUUID();
  const auditedAt = new Date().toISOString();

  const [entries, seals] = await Promise.all([
    Nexus.adapter.query(`tenants/${tenantId}/journalEntries`) as Promise<Array<{
      id?: string; dataSnapshot?: string; previousHash?: string;
    }>>,
    Nexus.adapter.query(`tenants/${tenantId}/fiscalSeals`) as Promise<Array<{
      entryId?: string; hash?: string;
    }>>,
  ]);

  const sealMap = new Map(seals.map(s => [s.entryId ?? '', s.hash ?? '']));
  const breaches: ChainAuditResult['breaches'] = [];

  for (const entry of entries) {
    const entryId      = entry.id ?? '';
    const dataSnapshot = entry.dataSnapshot ?? '';
    const previousHash = entry.previousHash ?? '';
    const expectedHash = await sha256(dataSnapshot + previousHash);
    const storedHash   = sealMap.get(entryId) ?? '';

    if (expectedHash !== storedHash) {
      breaches.push({ entryId, expectedHash, storedHash });
    }
  }

  const result: ChainAuditResult = {
    tenantId,
    auditId,
    auditedAt,
    totalEntries: entries.length,
    validEntries: entries.length - breaches.length,
    breaches,
    integrity:    breaches.length === 0 ? 'OK' : 'BREACH',
  };

  await Nexus.adapter.set(`tenants/${tenantId}/complianceAudits/${auditId}`, result);

  if (breaches.length > 0) {
    empireAudit.log({
      module: 'fleet',
      action: 'NF525_CHAIN_BREACH',
      severity: 'high',
      details: { tenantId, auditId, breachCount: breaches.length },
      timestamp: new Date(),
    });
    logger.error(`[ChainAudit] BREACH détecté sur ${tenantId} — ${breaches.length} entrée(s) compromise(s)`);
  } else {
    logger.info(`[ChainAudit] ${tenantId} — chaîne intègre (${entries.length} entrées)`);
  }

  return result;
}

function isInternalRequest(req: NextRequest): boolean {
  const secret = req.headers.get('x-internal-secret');
  return !!secret && secret === process.env.INTERNAL_API_SECRET;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isInternalRequest(req)) {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;
  }

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const result = await runChainAudit(tenantId);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const audits = await Nexus.adapter.query(`tenants/${tenantId}/complianceAudits`) as Array<{ auditedAt?: string }>;
  const latest = audits.sort((a, b) =>
    new Date(b.auditedAt ?? 0).getTime() - new Date(a.auditedAt ?? 0).getTime()
  )[0] ?? null;

  return NextResponse.json({ latestAudit: latest, totalAudits: audits.length });
}
