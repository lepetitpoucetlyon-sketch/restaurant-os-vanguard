import { z } from 'zod';
import { SanitizedStringSchema, MicrounitsSchema, UUIDSchema, TaxRateSchema } from './primitives';

export const ProductSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('product').default('product'),
  name:              z.string().min(1).pipe(SanitizedStringSchema),
  description:       z.string().pipe(SanitizedStringSchema).optional(),
  priceInMicrounits: MicrounitsSchema,
  priceInCents:      z.number().int().optional(), // Legacy compat
  taxRate:           TaxRateSchema.default('0.10'),
  categoryId:        UUIDSchema,
  imageUrl:          z.string().url().optional(),
  sku:               z.string().optional(),
  isAvailable:       z.boolean().default(true),
  stockQuantity:     z.number().optional(),
  allergens:         z.array(z.string()).default([]),
  recipeId:          z.string().optional(),
  updatedAt:         z.number().default(Date.now()),
}).catchall(z.any());

export type Product = z.infer<typeof ProductSchema>;

// ─── Privatisation contract (promoted from finance/documents/PrivatisationContract) ─
export type PrivatisationFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';

export interface PrivatisationData {
    clientNom: string;
    clientPrenom: string;
    clientEmail: string;
    clientTelephone: string;
    clientAdresse?: string;
    evenementNom: string;
    dateEvenement: string;
    heureDebut: string;
    heureFin: string;
    nombreConvives: number;
    formule: PrivatisationFormule;
    descriptionFormule?: string;
    montantHT: number;
    tauxTVA?: number;
    restaurantNom: string;
    restaurantAdresse: string;
    restaurantTelephone?: string;
    restaurantEmail?: string;
    restaurantSiret?: string;
    numeroContrat?: string;
    dateSignature?: string;
}
