import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { FiscalSealer } from '@/infrastructure/services/finance/FiscalSealer';
import { logger } from '@/lib/axiom';
import { JournalEntry } from '@nexus/contracts';
import { CryptoService } from '@/domain/services/CryptoService';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';

/**
 * 🛰️ API Backend de Synchro Hors-Ligne (Grade X)
 *
 * Reçoit les paquets de JournalEntry générés hors-ligne par la caisse.
 * Valide les montants, génère le vrai sceau NF525 serveur (avec NEXUS_TENANT_SECRET)
 * et enregistre de force dans Firestore (outrepassant les rules clientes).
 *
 * Auth : token Firebase JWT du POS (n'importe quel rôle tenant).
 * Le tenantId vient EXCLUSIVEMENT du token — pas du body (protection cross-tenant).
 */
export async function POST(req: NextRequest) {
  const caller = await requireTenantRole(req, 'serveur');
  if (isDenied(caller)) return caller;

  try {
    const body = await req.json();
    // tenantId du body intentionnellement ignoré — seul le claim JWT fait foi.
    const { journalEntries, isTrainingMode = false } = body;
    const tenantId = caller.tenantId;

    if (!tenantId || !journalEntries || !Array.isArray(journalEntries)) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    logger.info(`[Sync API] Réception de ${journalEntries.length} tickets hors-ligne pour le tenant ${tenantId}`);

    const sealedEntries = [];

    // On traite chaque ticket hors-ligne un par un pour garantir l'atomicité de la chaîne
    for (const entry of journalEntries as JournalEntry[]) {
      // Le brouillon hors-ligne portait un numéro provisoire ("OFFLINE-…") : on
      // attribue ici le VRAI numéro séquentiel NF525 côté serveur, de façon
      // transactionnelle (le compteur est incrémenté atomiquement).
      const receiptNumber = await FiscalSealer.generateSequentialReceiptNumber(tenantId);

      const sealedEntry = {
        ...entry,
        pieceNumber: receiptNumber,
        isValidated: true,
        status: 'validated',
      } as Record<string, unknown> & { id: string };

      const dataSnapshot = CryptoService.canonicalStringify({
        id: entry.id,
        receiptNumber,
        operatorId: 'OFFLINE_SYNC', // On pourrait récupérer l'opérateur d'origine
        tableId: entry.referenceId,
        totalTTCInMicrounits: entry.totalInMicrounits ?? (entry.amountInCents ?? 0) * 10_000,
        timestamp: entry.date,
      });

      const { hash, sealId } = await FiscalSealer.sealDataAtomically(
        dataSnapshot,
        tenantId,
        isTrainingMode,
        sealedEntry
      );

      sealedEntries.push({ id: entry.id, receiptNumber, sealId, hash });
    }

    logger.info(`[Sync API] Synchro réussie pour ${sealedEntries.length} tickets.`);
    return NextResponse.json({ success: true, sealedEntries });
  } catch (error) {
    logger.error('[Sync API] Erreur lors de la synchronisation', { error: String(error) });
    return NextResponse.json({ error: 'Erreur interne de synchronisation' }, { status: 500 });
  }
}
