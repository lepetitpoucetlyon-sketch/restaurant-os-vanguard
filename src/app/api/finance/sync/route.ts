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
      const receiptNumber = await FiscalSealer.generateSequentialReceiptNumber(tenantId);

      // 🛡️ DURCISSEMENT ANTI-FRAUDE : Recalcul serveur obligatoire
      const declaredTotal = entry.totalInMicrounits ?? (entry.amountInCents ?? 0) * 10_000;
      
      let computedCredits = 0;
      let computedDebits = 0;
      if (Array.isArray(entry.lines)) {
         for (const line of entry.lines) {
             if (line.side === 'credit') computedCredits += (line.creditInMicrounits ?? line.amountInCents * 10_000);
             if (line.side === 'debit') computedDebits += (line.debitInMicrounits ?? line.amountInCents * 10_000);
         }
      }

      if (computedCredits !== declaredTotal || computedDebits !== declaredTotal) {
         logger.error(`[Sync API] TENTATIVE DE FRAUDE NF525 DÉTECTÉE (Tenant: ${tenantId}). Totaux incohérents. Déclaré: ${declaredTotal}, Crédits: ${computedCredits}, Débits: ${computedDebits}`);
         // Rejeter le ticket et déclencher potentiellement un Sovereign Lockout
         return NextResponse.json({ error: 'NF525 Integrity Breach: Amounts mismatch' }, { status: 403 });
      }

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
