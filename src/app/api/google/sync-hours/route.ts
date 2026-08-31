import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

interface DayScheduleEntry {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface TenantHoursSettings {
  schedule?: DayScheduleEntry[];
  updatedAt?: number;
}

interface SyncHoursRecord {
  lastSyncedAt: number;
  syncedBy: string;
}

/**
 * GET /api/google/sync-hours
 * Lit les horaires d'ouverture du tenant depuis Nexus tenant settings
 * et simule la synchronisation vers Google Business Profile.
 *
 * Note: L'appel PUT réel vers l'API GBP nécessite une approbation
 * Google Actions Center (flux en attente).
 */
export async function GET(req: NextRequest) {
  try {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller;

    const { tenantId } = caller;

    // Lire les horaires depuis Nexus
    const hoursData = await Nexus.adapter.get<TenantHoursSettings>(
      `tenants/${tenantId}/settings/hours`,
      { vassalId: tenantId, actorId: caller.uid }
    );

    if (!hoursData || !hoursData.schedule) {
      return NextResponse.json(
        { error: 'Aucun horaire configuré pour ce tenant.' },
        { status: 404 }
      );
    }

    const schedule = hoursData.schedule;

    // TODO: Appel PUT vers l'API Google Business Profile (GBP)
    // Nécessite approbation Google Actions Center avant activation.
    //
    // const gbpAccessToken = await getGBPAccessToken(tenantId); // depuis tenantIntegrations/google
    // await fetch(
    //   `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}`,
    //   {
    //     method: 'PATCH',
    //     headers: {
    //       Authorization: `Bearer ${gbpAccessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       regularHours: {
    //         periods: schedule.map(day => ({
    //           openDay: day.day.toUpperCase(),
    //           openTime: day.open,
    //           closeDay: day.day.toUpperCase(),
    //           closeTime: day.close,
    //         })).filter(d => !schedule.find(s => s.day === d.openDay.toLowerCase())?.isClosed),
    //       },
    //     }),
    //     params: { updateMask: 'regularHours' },
    //   }
    // );

    // Enregistrer le timestamp de dernière sync
    const syncRecord: SyncHoursRecord = {
      lastSyncedAt: Date.now(),
      syncedBy: caller.uid,
    };

    await Nexus.adapter.update(
      `tenants/${tenantId}/integrations/google`,
      { hoursSyncedAt: syncRecord.lastSyncedAt },
      { vassalId: tenantId, actorId: caller.uid }
    );

    logger.info(`[Google SyncHours] Horaires lus pour tenant ${tenantId}`, { scheduleCount: schedule.length });

    return NextResponse.json({
      success: true,
      message: 'Horaires lus avec succès. Synchronisation GBP en attente d\'approbation Google Actions Center.',
      schedule,
      syncedAt: syncRecord.lastSyncedAt,
    });
  } catch (error) {
    logger.error('[Google SyncHours] Erreur', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
