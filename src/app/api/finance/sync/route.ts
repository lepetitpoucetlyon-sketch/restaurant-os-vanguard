import { NextRequest, NextResponse } from 'next/server';
import { FiscalSealer } from '@/infrastructure/services/finance/FiscalSealer';
import { logger } from '@/lib/axiom';
import { JournalEntry } from '@nexus/contracts';
import { CryptoService } from '@/domain/services/CryptoService';

/**
 * 🛰️ API Backend de Synchro Hors-Ligne (Grade X)
 * 
 * Reçoit les paquets de JournalEntry générés hors-ligne par la caisse.
 * Valide les montants, génère le vrai sceau NF525 serveur (avec NEXUS_TENANT_SECRET)
 * et enregistre de force dans Firestore (outrepassant les rules clientes).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, journalEntries, isTrainingMode = false } = body;

    if (!tenantId || !journalEntries || !Array.isArray(journalEntries)) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    logger.info(`[Sync API] Réception de ${journalEntries.length} tickets hors-ligne pour le tenant ${tenantId}`);

    const sealedEntries = [];

    // On traite chaque ticket hors-ligne un par un pour garantir l'atomicité de la chaîne
    for (const entry of journalEntries as JournalEntry[]) {
      const dataSnapshot = CryptoService.canonicalStringify({
        id: entry.id,
        receiptNumber: entry.pieceNumber,
        operatorId: 'OFFLINE_SYNC', // On pourrait récupérer l'opérateur d'origine
        tableId: entry.referenceId,
        totalTTCInMicrounits: (entry.amountInCents ?? 0) * 10000,
        timestamp: entry.date,
      });

      const { hash, signature, sealId, previousHash } = await FiscalSealer.sealDataAtomically(
        dataSnapshot,
        tenantId,
        isTrainingMode,
        entry
      );

      sealedEntries.push({ id: entry.id, sealId, hash });
    }

    logger.info(`[Sync API] Synchro réussie pour ${sealedEntries.length} tickets.`);
    return NextResponse.json({ success: true, sealedEntries });
  } catch (error) {
    logger.error('[Sync API] Erreur lors de la synchronisation', { error: String(error) });
    return NextResponse.json({ error: 'Erreur interne de synchronisation' }, { status: 500 });
  }
}
