import { z } from 'zod';

export const JournalLineSchema = z.object({
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  description: z.string(),
  side: z.enum(['debit', 'credit']),
  amountInCents: z.number().int().min(0),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  date: z.union([z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.string()]), // Support for Firestore Timestamp, Date or ISO String
  pieceNumber: z.string(),
  description: z.string(),
  lines: z.array(JournalLineSchema),
  referenceId: z.string().optional(),
  referenceType: z.enum(['order', 'supplier_order', 'expense', 'payroll', 'bank', 'manual']).optional(),
  isSystemGenerated: z.boolean(),
  isValidated: z.boolean(),
  fiscalSealHash: z.string().optional(),
});

export const ExpenseClaimSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  date: z.union([z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.string()]),
  amountInCents: z.number().int().positive(),
  category: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  receiptUrl: z.string().optional(),
});

export type ValidatedJournalEntry = z.infer<typeof JournalEntrySchema>;
export type ValidatedExpenseClaim = z.infer<typeof ExpenseClaimSchema>;
