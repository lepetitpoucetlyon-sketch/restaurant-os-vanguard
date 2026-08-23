/**
 * 🧱 Layout Builder — Types & Contrats Zod.
 *
 * Moteur de mise en page Bento Grid dynamique pour la personnalisation des
 * écrans métier (POS, KDS, Dashboard, Fournisseurs, Plan de Salle, Finance).
 *
 * 🔒 Invariant NF525 (Loi 7, axe 1) :
 * - Les slots marqués `locked: true` (ex: `FiscalReceiptSealZone`) ne peuvent
 *   JAMAIS être masqués (`visible: false` rejeté par Zod si `locked: true`),
 *   ni supprimés de la configuration.
 *
 * 📱 Invariant Responsive (Loi 7, axe 3) :
 * - Sur les écrans de faible largeur (< 640px), le renderer force une colonne
 *   unique pour éviter la troncature sur les terminaux TPE / Smartphones.
 */

import { z } from 'zod';

export const LayoutDeviceSchema = z.enum(['mobile', 'tablet', 'desktop', 'kiosk']);
export type LayoutDevice = z.infer<typeof LayoutDeviceSchema>;

export const LayoutPageIdSchema = z.enum([
    'pos',
    'kds',
    'dashboard',
    'suppliers',
    'floor-plan',
    'finance',
    'kiosk',
]);
export type LayoutPageId = z.infer<typeof LayoutPageIdSchema>;

export const LayoutSlotPositionSchema = z.object({
    x: z.number().int().min(0).max(12),
    y: z.number().int().min(0).max(20),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1).max(12),
});
export type LayoutSlotPosition = z.infer<typeof LayoutSlotPositionSchema>;

export const LayoutSlotSchema = z.object({
    id: z.string().min(1),
    componentKey: z.string().min(1),
    label: z.string().min(1).max(100),
    position: LayoutSlotPositionSchema,
    visible: z.boolean().default(true),
    /** 🔒 NF525 : Slot inaltérable et obligatoire (ne peut pas être masqué ni supprimé) */
    locked: z.boolean().default(false),
    minSize: z.object({ w: z.number().int().min(1), h: z.number().int().min(1) }).optional(),
    maxSize: z.object({ w: z.number().int().min(1), h: z.number().int().min(1) }).optional(),
}).refine(
    (slot) => !(slot.locked && !slot.visible),
    { message: "Un composant verrouillé NF525 (locked: true) doit obligatoirement être visible (visible: true)." },
);
export type LayoutSlot = z.infer<typeof LayoutSlotSchema>;

export const PageLayoutConfigSchema = z.object({
    pageId: LayoutPageIdSchema,
    device: LayoutDeviceSchema.default('desktop'),
    tenantId: z.string().min(1),
    grid: z.object({
        columns: z.number().int().min(1).max(12).default(12),
        rows: z.number().int().min(1).max(12).default(6),
        gap: z.enum(['4px', '8px', '12px', '16px']).default('12px'),
    }),
    slots: z.array(LayoutSlotSchema).min(1),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type PageLayoutConfig = z.infer<typeof PageLayoutConfigSchema>;

/**
 * Registry de composants de slots disponibles pour une page donnée.
 */
export type SlotComponentMap = Record<string, React.ComponentType<Record<string, unknown>>>;
