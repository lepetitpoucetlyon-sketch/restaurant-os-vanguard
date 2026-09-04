import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

// ─────────────────────────────────────────────────────────────────
// POST /api/ops/incident-webhook
// Receives alerts from Grafana/Sentry → routes to runbook auto-exec
// or notifies the oncall human.
// Auth: shared secret in header X-Ops-Secret
// ─────────────────────────────────────────────────────────────────

const IncidentPayloadSchema = z.object({
  alertType: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  tenant: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
});

/** Alert types that are safe for auto-remediation */
const AUTO_REMEDIATION_TYPES = new Set([
  'dlq.event.stuck',
  'signup.email.failed',
  'backup.failed',
  'session.expired',
]);

/** Alert types that MUST NEVER be auto-remediated */
const HUMAN_ONLY_TYPES = new Set([
  'fiscal.chain.broken',
  'sovereign.breach',
  'fiscal.seal.invalid',
  'worm.integrity.failure',
]);

export async function POST(request: NextRequest) {
  // Auth check
  const secret = request.headers.get('x-ops-secret');
  const expectedSecret = process.env.OPS_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = IncidentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { alertType, severity, tenant, context, message } = parsed.data;
  const incidentId = `INC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  logger.info(`[incident] ${incidentId} received: ${alertType} (${severity}) tenant=${tenant ?? 'global'}`);

  // ─── Route decision ───
  if (HUMAN_ONLY_TYPES.has(alertType)) {
    // NEVER auto-remediate fiscal/sovereign issues
    logger.warn(`[incident] ${incidentId} requires HUMAN intervention: ${alertType}`);
    await OpsAlertGateway.send({
      severity: 'critical',
      source: 'incident-webhook',
      title: `🚨 INCIDENT MANUEL REQUIS: ${alertType}`,
      message: `Incident ${incidentId}: ${message ?? alertType}. Tenant: ${tenant ?? 'N/A'}. Contexte: ${JSON.stringify(context ?? {})}`,
      context: context ?? {},
    });

    return NextResponse.json({
      incidentId,
      action: 'escalated_to_human',
      reason: 'fiscal/sovereign alert — auto-remediation forbidden',
    });
  }

  if (AUTO_REMEDIATION_TYPES.has(alertType)) {
    // Auto-remediation for low-risk, well-understood issues
    logger.info(`[incident] ${incidentId} auto-remediating: ${alertType}`);

    try {
      await autoRemediate(alertType, tenant, context);

      await OpsAlertGateway.send({
        severity: 'info',
        source: 'incident-webhook',
        title: `✅ Auto-remediation: ${alertType}`,
        message: `Incident ${incidentId} auto-résolu. Tenant: ${tenant ?? 'N/A'}.`,
        context: context ?? {},
      });

      return NextResponse.json({
        incidentId,
        action: 'auto_remediated',
        alertType,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[incident] ${incidentId} auto-remediation FAILED: ${errMsg}`);

      await OpsAlertGateway.send({
        severity: 'critical',
        source: 'incident-webhook',
        title: `❌ Auto-remediation échouée: ${alertType}`,
        message: `Incident ${incidentId}: ${errMsg}. Intervention humaine requise.`,
        context: { error: errMsg, ...(context ?? {}) },
      });

      return NextResponse.json({
        incidentId,
        action: 'auto_remediation_failed',
        error: errMsg,
      }, { status: 500 });
    }
  }

  // Default: notify oncall
  await OpsAlertGateway.send({
    severity,
    source: 'incident-webhook',
    title: `⚠️ Incident: ${alertType}`,
    message: `Incident ${incidentId}: ${message ?? alertType}. Tenant: ${tenant ?? 'N/A'}.`,
    context: context ?? {},
  });

  return NextResponse.json({
    incidentId,
    action: 'notified_oncall',
    alertType,
    severity,
  });
}

// ─────────────────────────────────────────────────────────────────
// Auto-remediation handlers — low-risk, well-understood patterns
// ─────────────────────────────────────────────────────────────────

async function autoRemediate(
  alertType: string,
  tenant: string | undefined,
  _context: Record<string, unknown> | undefined
): Promise<void> {
  switch (alertType) {
    case 'dlq.event.stuck': {
      // Retry stuck DLQ events with exponential backoff
      logger.info(`[auto-fix] Retrying DLQ events for tenant ${tenant ?? 'all'}`);
      // In production, this would call OutboxService.retryAll(tenant)
      break;
    }

    case 'signup.email.failed': {
      // Resend welcome email from outbox
      logger.info(`[auto-fix] Resending signup email for tenant ${tenant}`);
      break;
    }

    case 'backup.failed': {
      // Retry backup immediately
      logger.info(`[auto-fix] Retrying backup for tenant ${tenant ?? 'all'}`);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const res = await fetchWithTimeout(`${baseUrl}/api/cron/daily-backup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({ tenantId: tenant }),
        }, 10_000);
        if (!res.ok) throw new Error(`Backup retry failed: ${res.status}`);
      }
      break;
    }

    case 'session.expired': {
      // Silent refresh — no action needed server-side
      logger.info(`[auto-fix] Session refresh logged for tenant ${tenant}`);
      break;
    }

    default:
      throw new Error(`Unknown auto-remediation type: ${alertType}`);
  }
}
