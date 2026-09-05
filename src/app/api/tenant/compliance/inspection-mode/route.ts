/**
 * L25 + T30 — Bouton "Contrôle Fiscal / Sanitaire Inopiné" en 1 clic
 *
 * POST /api/tenant/compliance/inspection-mode
 *
 * Body : { mode: 'DGFIP' | 'DDPP' | 'URSSAF', fromTs?: number, toTs?: number }
 *
 * Retourne l'archive légale zippée-JSON (< 10 s target) constituée de :
 *   - Bundle AuditLogger.exportChain() sur la fenêtre demandée
 *   - Filtre thématique (DGFIP → fiscal + FISCAL_SEAL_ANOMALY_DETECTED, DDPP → HACCP_ALERT_RAISED + CHILLING_NONCONFORM,
 *     URSSAF → CROSS_SCOPE_REVEAL + payroll)
 *   - Hash final SHA-256 opposable
 *
 * RBAC : `settings.manage_security` (Directeur) — trace l'accès via AuditLogger `DGFIP_INSPECTION_MODE`.
 * Cf. docs/anglemort-restaurant-mcc.md § L25 / T30 (débloqué par ADR-014).
 */
import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { withMccRoute } from '@/lib/server/routeWrapper';
import { AuditLogger, type SecurityAuditAction as AuditAction } from '@/modules/compliance';
import { toError } from '@/lib/toError';
import { logger } from '@/lib/logger';

type InspectionMode = 'DGFIP' | 'DDPP' | 'URSSAF';

const ACTION_FILTERS: Record<InspectionMode, AuditAction[]> = {
  DGFIP: ['FISCAL_ARCHIVE_EXPORT', 'FISCAL_SEAL_ANOMALY_DETECTED', 'GRAND_TOTAL_COMPUTED', 'TICKET_Z_GENERATED', 'FEC_EXPORTED', 'DGFIP_INSPECTION_MODE'],
  DDPP: ['HACCP_ALERT_RAISED', 'CHILLING_NONCONFORM', 'RECALL_BROADCAST', 'TIAC_INCIDENT_OPENED', 'ALLERGEN_ORDER_BLOCKED'],
  URSSAF: ['CROSS_SCOPE_REVEAL', 'CROSS_SCOPE_GRANT', 'CROSS_SCOPE_REVOKE', 'ROLE_ELEVATED', 'TIP_REDISTRIBUTED'],
};

export const POST = withMccRoute(
  async (req, { caller }) => {
    const startedAt = Date.now();

  try {
    const body = (await req.json()) as { mode: InspectionMode; fromTs?: number; toTs?: number };
    if (!body.mode || !['DGFIP', 'DDPP', 'URSSAF'].includes(body.mode)) {
      return NextResponse.json({ error: 'mode invalide (DGFIP | DDPP | URSSAF)' }, { status: 400 });
    }

    const toTs = body.toTs ?? Date.now();
    // Défaut : 90 jours en arrière (fenêtre standard contrôle inopiné DGFiP).
    const fromTs = body.fromTs ?? toTs - 90 * 24 * 3600 * 1000;

    const bundle = await AuditLogger.exportChain(fromTs, toTs);
    const allowedActions = new Set(ACTION_FILTERS[body.mode]);
    const filteredLogs = bundle.logs.filter(l => allowedActions.has(l.action));

    // Audit de la génération elle-même — laisse une trace opposable
    await AuditLogger.logAction(
      caller.uid,
      'DGFIP_INSPECTION_MODE',
      `inspection/${body.mode}/${new Date(fromTs).toISOString()}_${new Date(toTs).toISOString()}`,
      {
        mode: body.mode,
        fromTs,
        toTs,
        totalMatchingLogs: filteredLogs.length,
        durationMs: Date.now() - startedAt,
      },
    ).catch(err => logger.warn('[inspection-mode] Audit trail failed', err));

    return NextResponse.json({
      mode: body.mode,
      fromTs,
      toTs,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      count: filteredLogs.length,
      finalHash: bundle.finalHash,
      integrityValid: bundle.integrityValid,
      integrityBreaks: bundle.breaks,
      logs: filteredLogs,
    });
  } catch (err) {
    logger.error('[inspection-mode] Export échoué', toError(err).message);
    return NextResponse.json({ error: `Export inspection échoué : ${toError(err).message}` }, { status: 500 });
  }
}, { minLevel: 'mcc_support' });

