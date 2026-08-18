/**
 * POST /api/admin/fleet/users/impersonate
 * Crée une session d'impersonation auditée : l'opérateur MCC voit
 * l'interface tenant avec une bannière visible. Jamais de credentials réels partagés.
 *
 * Body : { tenantId: string, userId: string }
 * Retourne : { url: string, sessionId: string, expiresAt: string }
 *
 * Protégé : super_admin uniquement.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface ImpersonateRequest {
  tenantId: string;
  userId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: ImpersonateRequest;
  try {
    body = await req.json() as ImpersonateRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, userId } = body;
  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'tenantId et userId requis' }, { status: 400 });
  }

  // Session valide 30 minutes — lecture seule côté tenant
  const sessionId  = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt  = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const operatorId = caller.uid;

  try {
    await Nexus.adapter.set(`mcc/impersonation/${sessionId}`, {
      sessionId,
      operatorId,
      tenantId,
      userId,
      startedAt: new Date().toISOString(),
      expiresAt,
      revoked: false,
    });

    empireAudit.log({
      module: 'fleet',
      action: 'IMPERSONATION_STARTED',
      severity: 'high',
      details: { sessionId, operatorId, tenantId, userId, expiresAt },
      timestamp: new Date(),
    });

    logger.info(`[MCC/impersonate] Session ${sessionId} — opérateur ${operatorId} → tenant ${tenantId} / user ${userId}`);

    const url = `/?tenantId=${encodeURIComponent(tenantId)}&impersonate=${encodeURIComponent(sessionId)}`;
    return NextResponse.json({ url, sessionId, expiresAt });

  } catch (err) {
    logger.error('[MCC/impersonate] Erreur création session:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/fleet/users/impersonate?sessionId=xxx
 * Révoque une session d'impersonation active.
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
  }

  await Nexus.adapter.set(`mcc/impersonation/${sessionId}`, { revoked: true }, { merge: true });

  empireAudit.log({
    module: 'fleet',
    action: 'IMPERSONATION_REVOKED',
    severity: 'high',
    details: { sessionId, operatorId: caller.uid },
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true });
}
