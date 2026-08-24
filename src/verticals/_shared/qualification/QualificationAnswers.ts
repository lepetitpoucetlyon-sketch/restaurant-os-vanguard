/**
 * 🎛️ QualificationAnswers — réponses opérateur aux 7 axes de la matrice de qualification.
 *
 * Contrat Zod strict qui transforme QUALIFICATION_MATRIX.md (doc) en STRUCTURE
 * EXÉCUTABLE. Deux entrées possibles :
 *  1. Wizard interactif (opérateur remplit 7 étapes).
 *  2. Auto-inférence depuis CompanyProfile + SectorStudy (pré-remplit, l'opérateur
 *     confirme). Cf. `QualificationEngine.inferAnswers()`.
 *
 * Sortie consommée par `QualificationEngine.resolve()` qui appelle les dériveurs
 * (§C.10) pour produire un `CalibratedTenantConfig` complet.
 */

import { z } from 'zod';

// ── Axe 1 — Échelle, gouvernance, multi-sites ──────────────────────────────────

export const ScaleSchema = z.enum(['solo', 'tpe', 'pme', 'eti']);
export const TopologySchema = z.enum(['mono', 'multi_independent', 'franchise']);
export const RbacGranularitySchema = z.enum(['simple', 'standard', 'granular']);

// ── Axe 2 — Fiscalité, encaissement ─────────────────────────────────────────────

export const CommerceModelSchema = z.enum(['b2c_counter', 'b2b_quotes', 'mixed', 'subscriptions']);
export const VatRegimeSchema = z.enum(['franchise_base', 'standard_20', 'multi_rate', 'reverse_charge']);
export const PaymentMethodSchema = z.enum([
    'cash', 'card', 'meal_vouchers', 'gift_cards', 'customer_wallets', 'sepa_direct_debit', 'split_bill',
]);

// ── Axe 3 — RH, temps de travail ────────────────────────────────────────────────

export const TimeTrackingSchema = z.enum(['none', 'planning', 'digital_clock', 'biometric_geo']);
export const PayrollComplexitySchema = z.enum(['standard_35h', 'modulation', 'advanced_bonuses', 'edi_export']);
export const SafetyLevelSchema = z.enum(['none', 'basic_registry', 'certifications', 'work_accidents']);

// ── Axe 4 — Logistique, approvisionnement ──────────────────────────────────────

export const StockNatureSchema = z.enum(['zero_stock', 'finished_goods', 'raw_recipes', 'perishable']);
export const TraceabilitySchema = z.enum(['none', 'lot', 'iot_cold_chain', 'recall_fanout']);
export const ProcurementSchema = z.enum(['invoice_only', 'delivery_note', 'three_way_match', 'price_watch']);

// ── Axe 5 — Hardware, IoT ───────────────────────────────────────────────────────

export const PosHardwareSchema = z.enum(['tablet', 'standard_pack', 'customer_display', 'automatic_cash']);
export const ProductionHardwareSchema = z.enum(['single_post', 'kds_screens', 'multi_printers', 'kiosk']);
export const AccessHardwareSchema = z.enum(['none', 'barcode', 'rfid_turnstile', 'certified_scale']);

// ── Axe 6 — Conformité réglementaire métier ────────────────────────────────────

/** Clés de régulations sectorielles (élargissable). */
export const RegulationKeySchema = z.enum([
    'haccp', 'allergen_inco', 'agec', 'ppsps', 'bsdd', 'situations_btp', 'siv',
    'piec', 'hds', 'rgpd_sensitive', 'erp_safety', 'sacem_music',
]);

// ── Axe 7 — Intelligence artificielle ───────────────────────────────────────────

export const AiLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

// ── Racine ──────────────────────────────────────────────────────────────────────

export const QualificationAnswersSchema = z.object({
    // Axe 1
    axis1_scale: ScaleSchema,
    axis1_topology: TopologySchema,
    axis1_rbac: RbacGranularitySchema,
    axis1_siteCount: z.number().int().positive().optional(),
    axis1_estimatedStaff: z.number().int().nonnegative().optional(),

    // Axe 2
    axis2_commerceModel: CommerceModelSchema,
    axis2_vatRegime: VatRegimeSchema,
    axis2_paymentMethods: z.array(PaymentMethodSchema).default([]),

    // Axe 3
    axis3_timeTracking: TimeTrackingSchema,
    axis3_payrollComplexity: PayrollComplexitySchema,
    axis3_safety: SafetyLevelSchema,

    // Axe 4
    axis4_stockNature: StockNatureSchema,
    axis4_traceability: TraceabilitySchema,
    axis4_procurement: ProcurementSchema,

    // Axe 5
    axis5_posHardware: PosHardwareSchema,
    axis5_production: ProductionHardwareSchema,
    axis5_access: AccessHardwareSchema,

    // Axe 6
    axis6_regulations: z.array(RegulationKeySchema).default([]),

    // Axe 7
    axis7_aiLevel: AiLevelSchema,
});

export type QualificationAnswers = z.infer<typeof QualificationAnswersSchema>;
export type Scale = z.infer<typeof ScaleSchema>;
export type Topology = z.infer<typeof TopologySchema>;
export type RbacGranularity = z.infer<typeof RbacGranularitySchema>;
export type CommerceModel = z.infer<typeof CommerceModelSchema>;
export type VatRegime = z.infer<typeof VatRegimeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type TimeTracking = z.infer<typeof TimeTrackingSchema>;
export type PayrollComplexity = z.infer<typeof PayrollComplexitySchema>;
export type SafetyLevel = z.infer<typeof SafetyLevelSchema>;
export type StockNature = z.infer<typeof StockNatureSchema>;
export type Traceability = z.infer<typeof TraceabilitySchema>;
export type Procurement = z.infer<typeof ProcurementSchema>;
export type PosHardware = z.infer<typeof PosHardwareSchema>;
export type ProductionHardware = z.infer<typeof ProductionHardwareSchema>;
export type AccessHardware = z.infer<typeof AccessHardwareSchema>;
export type RegulationKey = z.infer<typeof RegulationKeySchema>;
export type AiLevel = z.infer<typeof AiLevelSchema>;

/** Valeurs par défaut minimales (solo qui ouvre un mono-site B2C standard). */
export function defaultAnswers(): QualificationAnswers {
    return QualificationAnswersSchema.parse({
        axis1_scale: 'solo',
        axis1_topology: 'mono',
        axis1_rbac: 'simple',
        axis2_commerceModel: 'b2c_counter',
        axis2_vatRegime: 'standard_20',
        axis2_paymentMethods: ['cash', 'card'],
        axis3_timeTracking: 'none',
        axis3_payrollComplexity: 'standard_35h',
        axis3_safety: 'none',
        axis4_stockNature: 'zero_stock',
        axis4_traceability: 'none',
        axis4_procurement: 'invoice_only',
        axis5_posHardware: 'tablet',
        axis5_production: 'single_post',
        axis5_access: 'none',
        axis6_regulations: [],
        axis7_aiLevel: 0,
    });
}
