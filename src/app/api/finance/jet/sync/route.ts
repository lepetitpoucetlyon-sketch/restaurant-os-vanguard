import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/axiom';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import type { SovereignData } from '@/shared/nexus-contract';
import { toError } from "@/lib/toError";

/**
 * 🛰️ API Backend de Synchro Hors-Ligne pour le JET (NF525)
 *
 * Reçoit les événements techniques générés hors-ligne (allumage, erreurs).
 * Enregistre ces journaux dans Firestore.
 */
export async function POST(req: NextRequest) {
  const caller = await requireTenantRole(req, 'serveur');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    const { entries } = body;
    const tenantId = caller.tenantId;

    if (!tenantId || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    logger.info(`[JET Sync] Réception de ${entries.length} événements techniques hors-ligne pour le tenant ${tenantId}`);

    for (const entry of entries) {
      // Écriture du JET dans Firestore. On utilise un ID aléatoire si manquant.
      const id = (entry.id as string) || `jet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await Nexus.adapter.set(`tenants/${tenantId}/jetEntries/${id}`, {
          ...entry,
          id,
          syncedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error) {
    logger.error('[JET Sync] Erreur lors de la synchronisation', { error: toError(error).message });
    return NextResponse.json({ error: 'Erreur interne de synchronisation JET' }, { status: 500 });
  }
}
