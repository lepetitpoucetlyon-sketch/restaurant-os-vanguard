import { 
  JournalEntrySchema, 
  AccountSchema, 
  BankTransactionSchema, 
  ExpenseClaimSchema 
} from '../domain/schemas/finance';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';

type AnyRecord = Record<string, unknown>;

export class FinanceHydrator {
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
}
