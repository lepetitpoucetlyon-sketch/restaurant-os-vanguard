import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface ChainAuditResult {
  tenantId:      string;
  auditId:       string;
  auditedAt:     string;
  totalEntries:  number;
  validEntries:  number;
  breaches:      Array<{ sealId: string; expectedHash: string; storedHash: string; reason?: string }>;
  integrity:     'OK' | 'BREACH';
}

async function runChainAudit(tenantId: string): Promise<ChainAuditResult> {
  const auditId = crypto.randomUUID();
  const auditedAt = new Date().toISOString();

  const seals = await Nexus.adapter.query<{
    id?: string;
    hash?: string;
    previousHash?: string;
    dataSnapshot?: string;
    timestamp?: string;
  }>(`tenants/${tenantId}/fiscalSeals`);

  const sortedSeals = (seals || []).sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
  const breaches: ChainAuditResult['breaches'] = [];

  for (let i = 0; i < sortedSeals.length; i++) {
    const seal = sortedSeals[i];
    const sealId = seal.id ?? `seal_${i}`;
    const storedHash = seal.hash ?? '';
    const previousHash = seal.previousHash ?? '';
    const dataSnapshot = seal.dataSnapshot ?? '';

    // 1. Vérification de continuité de chaîne
    if (i > 0) {
      const prevSeal = sortedSeals[i - 1];
      if (previousHash !== prevSeal.hash) {
        breaches.push({
          sealId,
          expectedHash: prevSeal.hash ?? '',
          storedHash: previousHash,
          reason: 'Broken previousHash chain continuity',
        });
      }
    }

    // 2. Vérification d'intégrité du hash si dataSnapshot est présent
    if (dataSnapshot) {
      const expectedHash = await CryptoService.generateHash(dataSnapshot, previousHash);
      if (expectedHash !== storedHash) {
        breaches.push({
          sealId,
          expectedHash,
          storedHash,
          reason: 'Hash mismatch with dataSnapshot',
        });
      }
    }
  }

  return {
    tenantId,
    auditId,
    auditedAt,
    totalEntries: sortedSeals.length,
    validEntries: sortedSeals.length - breaches.length,
    breaches,
    integrity: breaches.length === 0 ? 'OK' : 'BREACH',
  };
}

export async function GET(req: NextRequest) {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller;

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId obligatoire' }, { status: 400 });
  }

  try {
    const result = await runChainAudit(tenantId);
    return NextResponse.json(result);
  } catch (err) {
    logger.error('[chain-audit] Audit execution error', err);
    return NextResponse.json({ error: 'Erreur lors de l\'audit de chaîne' }, { status: 500 });
  }
}
