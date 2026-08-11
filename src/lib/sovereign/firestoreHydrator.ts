/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { ZodSchema } from 'zod';
import { UserSchema, OrderSchema, TableSchema, ReservationSchema, FloorSchema, ZoneSchema } from '@nexus/contracts';
import { StockItemSchema } from '@nexus/contracts';;
import { ModuleSchema } from '@nexus/contracts';
import { 
  JournalEntrySchema, 
  AccountSchema, 
  BankTransactionSchema, 
  ExpenseClaimSchema 
} from '@/modules/finance/domain/schemas/finance';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
import { logger } from '@/lib/axiom';

type AnyRecord = Record<string, unknown>;

/**
 * 🏛️ FirestoreHydrator - Grade X
 * Assure la validation runtime et la transformation des données Firestore.
 */
export class FirestoreHydrator {
  static hydrateJournalEntry(raw: AnyRecord) {
    const parsed = JournalEntrySchema.safeParse(raw);
    if (!parsed.success) {
      throw new NexusError(
        NexusErrorCode.HYDRATION_FAILURE,
        'JournalEntry document is malformed in Firestore',
        { issues: parsed.error.issues.map(i => i.message) }
      );
    }

    const data = parsed.data;
    return {
      ...data,
      date: data.date || data.serverTimestamp,
      pieceNumber: data.pieceNumber || data.receiptNumber,
      description: data.description || `Transaction ${data.receiptNumber}`,
      amountInCents: Math.round(data.amountInMicrounits / 10_000),
      isValidated: data.status === 'validated',
      isSystemGenerated: true,
      updatedAt: data.serverTimestamp,
      lines: [] as import('@nexus/contracts').JournalLine[],
    };
  }

  static hydrateAccount(raw: AnyRecord) {
    const parsed = AccountSchema.safeParse(raw);
    if (!parsed.success) {
      throw new NexusError(
        NexusErrorCode.HYDRATION_FAILURE,
        'Account document is malformed in Firestore',
        { issues: parsed.error.issues.map(i => i.message) }
      );
    }
    const data = parsed.data;
    return {
      ...data,
      balanceInCents: Math.round(data.balanceInMicrounits / 10_000),
      updatedAt: data.updatedAt,
      class: data.class as '1' | '2' | '3' | '4' | '5' | '6' | '7',
    };
  }

  static hydrateBankTransaction(raw: AnyRecord) {
    const parsed = BankTransactionSchema.safeParse(raw);
    if (!parsed.success) {
      throw new NexusError(
        NexusErrorCode.HYDRATION_FAILURE,
        'BankTransaction document is malformed in Firestore',
        { issues: parsed.error.issues.map(i => i.message) }
      );
    }
    const data = parsed.data;
    return {
      ...data,
      date: data.date || data.executedAt,
      label: data.label || data.description,
      amountInCents: Math.round(data.amountInMicrounits / 10_000),
      type: (data.type || data.direction) as 'credit' | 'debit',
      isReconciled: !!data.reconciledAt,
      updatedAt: data.executedAt,
    };
  }

  static hydrateExpenseClaim(raw: AnyRecord) {
    const parsed = ExpenseClaimSchema.safeParse(raw);
    if (!parsed.success) {
      throw new NexusError(
        NexusErrorCode.HYDRATION_FAILURE,
        'ExpenseClaim document is malformed in Firestore',
        { issues: parsed.error.issues.map(i => i.message) }
      );
    }
    const data = parsed.data;
    return {
      ...data,
      date: data.date || data.submittedAt,
      userId: data.userId || data.submittedBy,
      userName: data.userName || 'Unknown',
      userRole: data.userRole || 'employee',
      amountInCents: Math.round(data.amountInMicrounits / 10_000),
      updatedAt: data.submittedAt,
    };
  }

  // --- Legacy Compatibility & Helpers ---

  static hydrateUser(data: AnyRecord) { return this.hydrate(data, UserSchema, 'users'); }
  static hydrateOrder(data: AnyRecord) { return this.hydrate(data, OrderSchema, 'orders'); }
  static hydrateStockItem(data: AnyRecord) { return this.hydrate(data, StockItemSchema, 'inventory'); }
  static hydrateTable(data: AnyRecord) { return this.hydrate(data, TableSchema, 'tables'); }
  static hydrateReservation(data: AnyRecord) { return this.hydrate(data, ReservationSchema, 'reservations'); }
  static hydrateFloor(data: AnyRecord) { return this.hydrate(data, FloorSchema, 'floors'); }
  static hydrateZone(data: AnyRecord) { return this.hydrate(data, ZoneSchema, 'zones'); }
  static hydrateModule(data: AnyRecord) { return this.hydrate(data, ModuleSchema, 'modules'); }

  private static hydrate<T>(data: AnyRecord, schema: ZodSchema<T>, collection: string): T | null {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    logger.error(`[FirestoreHydrator] Data corruption in ${collection}`, {
      errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }

  static hydrateCollection<T>(
    docs: AnyRecord[],
    hydrator: (raw: AnyRecord) => T
  ): T[] {
    return docs.map(doc => {
        try {
            return hydrator(doc);
        } catch (e) {
            logger.warn(`[FirestoreHydrator] Skipping corrupted document: ${e instanceof Error ? e.message : 'Unknown error'}`);
            return null;
        }
    }).filter((r): r is T => r !== null);
  }
}
