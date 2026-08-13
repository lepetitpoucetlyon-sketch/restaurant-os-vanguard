import { z } from 'zod';

export const ReceiptLayoutConfigSchema = z.object({
  showLogo: z.boolean().default(false),
  footerMessage: z.string().max(200).default(''),
  showQrCode: z.boolean().default(false),
  qrCodeUrl: z.string().url().optional().or(z.literal('')),
  showLoyaltyPoints: z.boolean().default(false),
  prepTicketPosteName: z.string().max(60).default(''),
  showTaxBreakdown: z.boolean().default(true),
});

export type ReceiptLayoutConfig = z.infer<typeof ReceiptLayoutConfigSchema>;

export const RECEIPT_CONFIG_DEFAULTS: ReceiptLayoutConfig = ReceiptLayoutConfigSchema.parse({});

export const receiptConfigPath = (tenantId: string) => `tenants/${tenantId}/config/receipt`;
