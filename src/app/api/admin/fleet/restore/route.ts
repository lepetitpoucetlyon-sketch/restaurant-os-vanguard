/**
 * 1-Click Tenant Restore — mcc-support-ai-3
 *
 * Déclenche une restauration PITR (Point-in-Time Recovery) Firestore pour un tenant.
 * Crée un job de restauration dans mcc/restoreJobs/{jobId} et notifie le tenant.
 *
 * En production : appelle l'API Firestore PITR via le SDK Admin.
 * En dev/mock : simule le job avec un statut SIMULATED.
 *
 * POST /api/admin/fleet/restore
 *   Body: { tenantId: string; targetTimestamp: string; reason: string; operatorId: string }
 *   Retourne: { jobId: string; status: 'initiated' | 'simulated' }
 *
 * GET /api/admin/fleet/restore?tenantId — liste les jobs de restauration
 *
 * Protégé : super_admin. NF525 : journalEntries et fiscalSeals ne sont PAS restaurés.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusInfra } from '@/lib/nexus/NexusInfra';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { parsePaginationParams, paginateAfterId } from '@/lib/api/pagination';

const RestoreBodySchema = z.object({
  tenantId: z.string().min(1),
  targetTimestamp: z.string().datetime(), // Vérifie le format ISO 8601
  reason: z.string().min(1),
  operatorId: z.string().min(1)
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof RestoreBodySchema>;
  try {
    body = RestoreBodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, targetTimestamp, reason, operatorId } = body;

  // Validation : la restauration ne peut pas dépasser J-30 (limite PITR Firestore)
  const targetDate = new Date(targetTimestamp);
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: 'targetTimestamp invalide (ISO 8601 requis)' }, { status: 400 });
  }
  const maxAge = 30 * 86400_000;
  if (Date.now() - targetDate.getTime() > maxAge) {
    return NextResponse.json({ error: 'Restauration limitée à J-30 (PITR Firestore)' }, { status: 400 });
  }

  const initiatedAt = new Date().toISOString();

  // PITR délégué au provider NexusInfra (agnostique : Firestore / Postgres / Mongo / …)
  const pitrResult = await NexusInfra.pitrRestore(tenantId, targetTimestamp);
  const { jobId, pitrOperationId = null, status } = pitrResult;

  const job = {
    jobId,
    tenantId,
    targetTimestamp,
    reason,
    operatorId,
    status,
    pitrOperationId,
    initiatedAt,
    note: 'NF525 (journalEntries, fiscalSeals) exclus de la restauration',
  };

  await Nexus.adapter.set(`mcc/restoreJobs/${jobId}`, job);

  empireAudit.log({
    module: 'fleet',
    action: 'TENANT_RESTORE_INITIATED',
    severity: 'high',
    details: { tenantId, jobId, targetTimestamp, status },
    timestamp: new Date(),
  });

  logger.info(`[Restore] Job ${jobId} pour ${tenantId} → ${targetTimestamp} (${status})`);
  return NextResponse.json({ success: true, jobId, status, initiatedAt });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const jobId   = req.nextUrl.searchParams.get('jobId');
  const tenantId = req.nextUrl.searchParams.get('tenantId');

  if (jobId) {
    const job = await Nexus.adapter.get(`mcc/restoreJobs/${jobId}`);
    return NextResponse.json({ jobs: job ? [job] : [], total: job ? 1 : 0 });
  }

  const jobs = await Nexus.adapter.query('mcc/restoreJobs') as Array<{ tenantId?: string; jobId?: string; initiatedAt?: string }>;
  const filtered = tenantId ? jobs.filter(j => j.tenantId === tenantId) : jobs;
  // Tri décroissant par initiatedAt pour que la pagination cursor commence par les plus récents.
  filtered.sort((a, b) => (b.initiatedAt ?? '').localeCompare(a.initiatedAt ?? ''));

  const pagination = parsePaginationParams(req.url);
  const paged = paginateAfterId(filtered, pagination, (j) => j.jobId);

  return NextResponse.json({ jobs: paged.items, total: paged.total, nextCursor: paged.nextCursor });
}
