import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { withPublicRoute } from '@/lib/server/routeWrapper';
import { runWithServerTenant } from '@/lib/server/ServerTenantStorage';

export const dynamic = 'force-dynamic';

const ServiceRequestSchema = z.object({
  tenantId: z.string().min(1),
  table: z.string().default('Libre'),
  type: z.enum(['water', 'bread', 'bill', 'assistance', 'custom']),
  note: z.string().max(200).optional(),
  requestedAt: z.string().optional(),
});

/**
 * 🔔 POST /api/v1/orders/service-request
 * Enregistre une demande convive (eau, pain, addition, appel serveur)
 * et propage l'événement temps réel vers le personnel de salle.
 */
export const POST = withPublicRoute(
  async (req: NextRequest, ctx): Promise<NextResponse> => {
    try {
      const rawBody = await req.json().catch(() => ({}));
      const queryTenantId = req.nextUrl.searchParams.get('tenantId');
      const parseResult = ServiceRequestSchema.safeParse({
        ...rawBody,
        tenantId: rawBody.tenantId || queryTenantId || ctx.resolvedTenantId,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Payload de demande de service invalide', details: parseResult.error.flatten() },
          { status: 400 },
        );
      }

      const { tenantId, table, type, note, requestedAt } = parseResult.data;
      const effectiveTime = requestedAt || new Date().toISOString();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return await runWithServerTenant({ tenantId, role: 'guest', isMcc: false }, async () => {
        // 1. Persistance de la demande dans l'espace tenant
        await Nexus.adapter.set(`tenants/${tenantId}/serviceRequests/${requestId}`, {
          id: requestId,
          table,
          type,
          note: note ?? null,
          status: 'pending',
          requestedAt: effectiveTime,
          createdAt: effectiveTime,
        });

        // 2. Émission de l'événement sur le bus d'événements
        await NexusEventBus.emitDurable('ops.waiter_call_requested', {
          v: 1,
          tenantId,
          tableId: table,
          tableName: table === 'Libre' ? 'Table' : `Table ${table}`,
          reason: type,
          note,
          requestedAt: effectiveTime,
        });

        logger.info(`[ServiceRequest] Appel serveur reçu: Table ${table} (${type})`, {
          tenantId,
          correlationId: ctx.correlationId,
        });

        return NextResponse.json({ success: true, id: requestId });
      });
    } catch (error) {
      logger.error('[ServiceRequest] Échec du traitement de la demande', {
        error,
        correlationId: ctx.correlationId,
      });
      return NextResponse.json({ error: 'Erreur interne lors du traitement' }, { status: 500 });
    }
  },
);

