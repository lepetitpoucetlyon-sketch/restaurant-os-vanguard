import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const CLOCK_DEBOUNCE_MS = 60_000;

// Rôles autorisés à pointer POUR un autre employé (mode kiosk PIN partagé ou
// badge staff). En dehors de ces rôles, le pointage n'est autorisé que pour
// soi-même (caller.uid === userId).
const KIOSK_ROLES = new Set(['admin', 'directeur', 'manager']);

const ClockInSchema = z.object({
  userId: z.string().min(1).max(120),
  timestamp: z.number().int().positive().optional(),
});

export const POST = withTenantRoute(
  async (req, { tenantId, caller }) => {
    const json = await req.json().catch(() => null);
    const parsed = ClockInSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { userId, timestamp } = parsed.data;
    const clockTime = timestamp ?? Date.now();

    // Anti-spoofing (audit sécurité API 2026-08-31) : un employé authentifié
    // ne peut pointer que pour lui-même, sauf s'il a un rôle kiosk-authorisé
    // (mode borne partagée type PIN pad, badge staff, etc.).
    if (caller.uid !== userId && !KIOSK_ROLES.has(caller.role ?? '')) {
      logger.warn(
        `[ClockInAPI] Spoofing bloqué : uid=${caller.uid} role=${caller.role} tentait de pointer pour userId=${userId}`,
      );
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas pointer pour un autre employé.' },
        { status: 403 },
      );
    }

    // Anti-rebond 60s — Invariant #4 concurrence pointeuse
    const recentEntries = await Nexus.adapter.query<{ createdAt: string }>(
      `tenants/${tenantId}/shiftEntries`,
      {
        where: [{ field: 'userId', operator: '==', value: userId }],
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 1,
      }
    );
    if (recentEntries.length > 0) {
      const lastMs = new Date(recentEntries[0].createdAt).getTime();
      const elapsed = clockTime - lastMs;
      if (elapsed < CLOCK_DEBOUNCE_MS) {
        logger.warn(`[ClockInAPI] Debounce: ${userId} a déjà pointé il y a ${elapsed}ms — rejeté`);
        return NextResponse.json(
          { success: false, reason: 'debounce', retryAfterMs: CLOCK_DEBOUNCE_MS - elapsed },
          { status: 429 }
        );
      }
    }

    const entryId = `clock_${userId}_${clockTime}`;

    // Persistance dans shiftEntries pour harmonisation avec TimeclockDashboard (Item R9)
    await Nexus.adapter.set(`tenants/${tenantId}/shiftEntries/${entryId}`, {
      id: entryId,
      userId,
      clockIn: new Date(clockTime).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    await dispatchServerEvent('hr.clock_in', {
      v: 1,
      tenantId,
      userId,
      timestamp: clockTime,
    });

    logger.info(`[ClockInAPI] Pointage entrant enregistré pour ${userId} dans shiftEntries (${entryId})`);

    return NextResponse.json({ success: true, entryId });
  },
);

