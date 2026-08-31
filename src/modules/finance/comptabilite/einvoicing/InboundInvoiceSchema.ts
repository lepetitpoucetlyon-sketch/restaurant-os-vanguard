import { z } from 'zod';

const EInvoicePartySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  siret: z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)'),
  vatNumber: z.string().regex(/^FR\d{11}$/, 'N° TVA FR invalide').optional(),
  address: z.string().min(1).max(500).trim(),
  country: z.string().length(2).default('FR'),
});

const EInvoiceLineSchema = z.object({
  description: z.string().min(1).max(500).trim(),
  quantity: z.number().positive(),
  unitPriceHTInMicrounits: z.number().int().min(0),
  vatRate: z.number().min(0).max(1),
  totalHTInMicrounits: z.number().int().min(0),
  totalTTCInMicrounits: z.number().int().min(0),
});

export const InboundInvoiceSchema = z.object({
  providerInvoiceId: z.string().min(1).max(200),
  invoiceNumber: z.string().min(1).max(100).trim(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis').optional(),
  format: z.enum(['factur-x', 'ubl', 'cii']),
  seller: EInvoicePartySchema,
  buyer: EInvoicePartySchema,
  lines: z.array(EInvoiceLineSchema).min(1, 'Au moins une ligne requise'),
  totalHTInMicrounits: z.number().int().min(0),
  totalVATInMicrounits: z.number().int().min(0),
  totalTTCInMicrounits: z.number().int().min(0),
  currency: z.string().length(3).default('EUR'),
  rawXml: z.string().optional(),
  pdfUrl: z.string().url().optional(),
}).refine(
  data => {
    const computedHT = data.lines.reduce((s, l) => s + l.totalHTInMicrounits, 0);
    return Math.abs(computedHT - data.totalHTInMicrounits) <= data.lines.length * 1_000;
  },
  { message: 'Total HT incohérent avec la somme des lignes', path: ['totalHTInMicrounits'] }
).refine(
  data => data.totalTTCInMicrounits >= data.totalHTInMicrounits,
  { message: 'Total TTC ne peut pas être inférieur au HT', path: ['totalTTCInMicrounits'] }
);

export type InboundInvoiceInput = z.infer<typeof InboundInvoiceSchema>;

export const InboundInvoiceStatusSchema = z.enum([
  'received',
  'validated',
  'approved',
  'rejected',
  'paid',
  'disputed',
]);

export type InboundInvoiceStatus = z.infer<typeof InboundInvoiceStatusSchema>;
