import { z } from 'zod';

const OutboundPartySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  siret: z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)'),
  vatNumber: z.string().regex(/^FR\d{11}$/, 'N° TVA FR invalide').optional(),
  address: z.string().min(1).max(500).trim(),
  country: z.string().length(2).default('FR'),
});

const OutboundLineSchema = z.object({
  description: z.string().min(1).max(500).trim(),
  quantity: z.number().positive(),
  unitPriceHTInMicrounits: z.number().int().min(0),
  vatRate: z.number().min(0).max(1),
  totalHTInMicrounits: z.number().int().min(0),
  totalTTCInMicrounits: z.number().int().min(0),
});

export const OutboundInvoiceSchema = z.object({
  internalRef: z.string().min(1).max(200),
  invoiceNumber: z.string().min(1).max(100).trim(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  clientType: z.enum(['b2b', 'b2g']),
  seller: OutboundPartySchema,
  buyer: OutboundPartySchema,
  lines: z.array(OutboundLineSchema).min(1, 'Au moins une ligne'),
  totalHTInMicrounits: z.number().int().min(0),
  totalVATInMicrounits: z.number().int().min(0),
  totalTTCInMicrounits: z.number().int().min(0),
  currency: z.string().length(3).default('EUR'),
}).refine(
  d => {
    const computed = d.lines.reduce((s, l) => s + l.totalHTInMicrounits, 0);
    return Math.abs(computed - d.totalHTInMicrounits) <= d.lines.length * 1_000;
  },
  { message: 'Total HT incohérent', path: ['totalHTInMicrounits'] },
).refine(
  d => d.totalTTCInMicrounits >= d.totalHTInMicrounits,
  { message: 'TTC < HT impossible', path: ['totalTTCInMicrounits'] },
);

export type OutboundInvoiceInput = z.infer<typeof OutboundInvoiceSchema>;

export const OutboundInvoiceStatusSchema = z.enum([
  'draft',
  'submitted',
  'deposee',
  'mise_a_disposition',
  'approuvee',
  'refusee',
  'encaissee',
  'rejetee_dgfip',
]);

export type OutboundInvoiceStatus = z.infer<typeof OutboundInvoiceStatusSchema>;

/** Enregistrement Nexus d'une facture émise */
export interface OutboundInvoiceRecord {
  id: string;
  tenantId: string;
  providerInvoiceId: string;
  internalRef: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientType: 'b2b' | 'b2g';
  buyerSiret: string;
  buyerName: string;
  totalHTInMicrounits: number;
  totalVATInMicrounits: number;
  totalTTCInMicrounits: number;
  status: OutboundInvoiceStatus;
  /** Historique complet des changements de statut (immutable append) */
  statusHistory: Array<{ status: OutboundInvoiceStatus; at: string; source: 'webhook' | 'poll' }>;
  emittedAt: string;
  updatedAt: string;
}
