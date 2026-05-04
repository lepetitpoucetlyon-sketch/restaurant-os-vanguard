import { z } from 'zod';

/** 📦 Reception Control Schema */
export const ReceptionSchema = z.object({
  deliveryId: z.string().min(1, "L'ID de livraison est obligatoire."),
  supplierName: z.string().min(1, "Le nom du fournisseur est requis."),
  truckTemp: z.number({
    message: "La température du camion est obligatoire et doit être un nombre."
  }),
  hygieneStatus: z.enum(['clean', 'acceptable', 'dirty'], {
    message: "L'état d'hygiène doit être 'clean', 'acceptable' ou 'dirty'."
  }),
  itemsChecked: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['ok', 'warning', 'rejected']),
    temp: z.number().optional(),
    quantity: z.number().positive("La quantité reçue doit être supérieure à zéro."),
  })).min(1, "Au moins un article doit être contrôlé."),
  rejectionReason: z.string().optional(),
  photos: z.array(z.string()).optional(),
  validatedBy: z.string().min(1, "La signature du contrôleur est obligatoire."),
});

/** 🧽 Cleaning Control Schema */
export const CleaningSchema = z.object({
  zoneId: z.string(),
  areaName: z.string(),
  status: z.enum(['pending', 'completed', 'verified']),
  checkedAt: z.string(),
  staffId: z.string(),
  verifierId: z.string().optional(),
  notes: z.string().optional(),
});

/** 🛢️ Oil Quality Schema */
export const OilCheckSchema = z.object({
  fryerId: z.string(),
  tpmValue: z.number(), // Total Polar Materials
  decision: z.enum(['ok', 'change_soon', 'must_change']),
  changedAt: z.string().optional(),
  staffId: z.string(),
});

/** 🗑️ Waste Log Schema */
export const WasteSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  reason: z.enum(['expired', 'damaged', 'preparation_error', 'inventory_gap']),
  timestamp: z.string(),
  staffId: z.string(),
});

export type ReceptionData = z.infer<typeof ReceptionSchema>;
export type CleaningData = z.infer<typeof CleaningSchema>;
export type OilCheckData = z.infer<typeof OilCheckSchema>;
export type WasteData = z.infer<typeof WasteSchema>;
