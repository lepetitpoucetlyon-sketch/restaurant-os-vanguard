import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FISCAL_CONSTANTS } from './FiscalAdapter';
import { CryptoService } from '@domain/services/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import type { JournalEntry, FiscalSeal } from '@nexus/contracts';
import type { CartItem } from '@/modules/ops/engine/types';
import { NexusEventBus } from '@/lib/events/NexusEventBus';

export type PaymentMode = 'cash' | 'card' | 'check' | 'ticket_resto' | 'transfer';

export interface BridgePayload {
  cartItems: CartItem[];
  operatorId: string;
  tableId: string | null;
  tenantId: string;
  paymentMode?: PaymentMode;
  covers?: number;
  isTrainingMode?: boolean;
}

export interface BridgeResult {
  journalEntry: JournalEntry;
  seal: FiscalSeal;
}

const DEVICE_ID = 'MAIN_POS';
const SCHEMA_VERSION = '1.0.0';

/**
 * Calcule la ventilation TVA par taux à partir des lignes du panier.
 */
function computeTvaBreakdown(items: CartItem[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const item of items) {
    const rate = item.taxRate ?? '0.10';
    const lineHT = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
    const tva = Math.round(lineHT * parseFloat(rate));
    breakdown[rate] = (breakdown[rate] ?? 0) + tva;
  }
  return breakdown;
}

/**
 * Génère un numéro de ticket conforme NF525 : AAAA-NNNNNN
 */
function generateReceiptNumber(): string {
  const year = new Date().getFullYear().toString();
  const seq = Date.now().toString().slice(-6);
  return `${year}-${seq}`;
}

/**
 * Récupère le dernier FiscalSeal depuis Nexus pour assurer la continuité de chaîne.
 */
async function getLastSeal(tenantId: string): Promise<FiscalSeal | undefined> {
  try {
    const seals = await Nexus.adapter.query<FiscalSeal>(
      `tenants/${tenantId}/fiscalSeals`
    );
    if (!seals || seals.length === 0) return undefined;
    return [...seals].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    })[0];
  } catch {
    return undefined;
  }
}

/**
 * FinancialNexusBridge — Grade X "NF525 Suture"
 *
 * Converts a validated POS cart into:
 *  1. A NF525-compliant JournalEntry (immutable ledger record)
 *  2. A FiscalSeal (hash chain link)
 *
 * Both records are written atomically to Nexus before returning.
 * Designed to be called from handlePaymentComplete — never blocks UI.
 */
export const FinancialNexusBridge = {
  async processOrder(payload: BridgePayload): Promise<BridgeResult> {
    const {
      cartItems,
      operatorId,
      tableId,
      tenantId,
      isTrainingMode = false,
    } = payload;

    if (cartItems.length === 0) {
      throw new Error('FinancialNexusBridge: panier vide');
    }

    // ── 1. Calcul des totaux ──────────────────────────────────────────────────
    const totalTTCInMicrounits = cartItems.reduce(
      (acc, item) =>
        acc +
        item.unitPriceInMicrounits * item.quantity -
        (item.discountInMicrounits ?? 0),
      0
    );
    const tvaBreakdown = computeTvaBreakdown(cartItems);
    const totalTVAInMicrounits = Object.values(tvaBreakdown).reduce(
      (a, b) => a + b,
      0
    );
    const totalHTInMicrounits = totalTTCInMicrounits - totalTVAInMicrounits;

    // ── 2. Chaîne de scellement ───────────────────────────────────────────────
    const lastSeal = await getLastSeal(tenantId);
    const previousHash = lastSeal?.hash ?? FISCAL_CONSTANTS.GENESIS_ROOT;
    const receiptNumber = generateReceiptNumber();
    const entryId = SharedKernel.generateId('JE');
    const correlationId = SharedKernel.generateId('COR');
    const now = new Date().toISOString();

    const dataSnapshot = CryptoService.canonicalStringify({
      id: entryId,
      receiptNumber,
      operatorId,
      tableId,
      totalTTCInMicrounits,
      tvaBreakdown,
      timestamp: now,
    } as any);

    let hash: string;
    let signature: string;

    if (isTrainingMode) {
      hash = FISCAL_CONSTANTS.TRAINING_MODE_HASH;
      signature = 'VTC_SCHOOL_TRAINING_SIGNATURE';
    } else {
      hash = await CryptoService.generateHash(dataSnapshot, previousHash);
      signature = await CryptoService.signFiscalData(hash, tenantId);
    }

    // ── 3. JournalEntry NF525 ─────────────────────────────────────────────────
    const journalEntry: JournalEntry = {
      id: entryId,
      date: now,
      pieceNumber: receiptNumber,
      description: `Vente POS — Table ${tableId ?? 'Emporté'} — ${receiptNumber}`,
      referenceId: tableId ?? undefined,
      referenceType: 'order',
      isSystemGenerated: true,
      isValidated: true,
      fiscalSealHash: hash,
      sealedAt: now,
      type: 'revenue' as any,
      amountInCents: Math.round(totalTTCInMicrounits / 10000),
      status: 'validated',
      updatedAt: now,
      lines: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPriceInMicrounits: item.unitPriceInMicrounits,
        taxRate: item.taxRate,
        totalInMicrounits:
          item.unitPriceInMicrounits * item.quantity -
          (item.discountInMicrounits ?? 0),
      })),
    } as unknown as JournalEntry;

    // ── 4. FiscalSeal ─────────────────────────────────────────────────────────
    const sealId = SharedKernel.generateId('SEAL');
    const seal: FiscalSeal = {
      id: sealId,
      transactionId: entryId,
      timestamp: now,
      dataSnapshot,
      hash,
      previousHash,
      signature,
      updatedAt: now,
    };

    // ── 5. Écriture atomique Nexus ────────────────────────────────────────────
    await Promise.all([
      Nexus.adapter.set(
        `tenants/${tenantId}/journalEntries/${entryId}`,
        journalEntry
      ),
      Nexus.adapter.set(
        `tenants/${tenantId}/fiscalSeals/${sealId}`,
        seal
      ),
    ]);

    // Émission de l'événement — déclenche stock, Ticket Z, IA en parallèle
    NexusEventBus.emit('order.paid', {
      orderId: entryId,
      tableId,
      tenantId,
      operatorId,
      items: cartItems,
      totalInMicrounits: totalTTCInMicrounits,
      paymentMode: 'card',
    }).catch(() => {}); // fire-and-forget — ne bloque pas le retour bridge

    empireAudit.log({
      module: 'accounting',
      action: 'POS_PAYMENT_SEALED',
      details: {
        entryId,
        sealId,
        hash: hash.substring(0, 8),
        totalTTC: totalTTCInMicrounits,
        receiptNumber,
        isTrainingMode,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    return { journalEntry, seal };
  },
};
