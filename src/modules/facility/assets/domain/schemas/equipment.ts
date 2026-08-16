import { z } from 'zod';

export const EquipmentCategorySchema = z.enum([
  'COOKING',          // Fours, pianos, friteuses, plaques induction, salamandres
  'COLD_STORAGE',     // Chambres froides pos/neg, armoires réfrigérées, tours pâtissiers
  'WASHING',          // Lave-verres, lave-vaisselle à capot, plonge
  'BEVERAGE_COFFEE',  // Machines espresso, moulins, tireuses à bière, centrifugeuses
  'FOOD_PREP',        // Robots coupe, batteurs, trancheurs, sous-vide
  'POS_HARDWARE',     // TPE, imprimantes caisse, tiroirs-caisses, KDS, balances
  'HVAC_EXTRACTION',  // Hottes d'extraction, caissons, climatisation
  'SECURITY_SAFETY',  // Extincteurs, alarmes, coupures d'urgence gaz/élec
  'OTHER',
]);

export type EquipmentCategory = z.infer<typeof EquipmentCategorySchema>;

export const EquipmentStatusSchema = z.enum([
  'OPERATIONAL',      // Fonctionne parfaitement
  'DEGRADED',         // Fonctionne en mode dégradé (alerte mineure)
  'OUT_OF_ORDER',     // En panne / Bloqué
  'MAINTENANCE_DUE',  // Révision obligatoire dépassée ou imminente
  'DECOMMISSIONED',   // Déclassé / Mis au rebut
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;

export const GuideTypeSchema = z.enum([
  'MANUAL_PDF',              // Notice d'utilisation officielle / technique
  'VIDEO_TUTO',              // Tutoriel vidéo YouTube / Loom / MP4
  'CLEANING_PROCEDURE',      // Procédure de nettoyage / détartrage quotidien ou hebdo
  'TROUBLESHOOTING_GUIDE',   // Fiche de dépannage rapide
  'SPARE_PARTS_LINK',        // Lien vers revendeur de pièces détachées ou vue éclatée
]);

export type GuideType = z.infer<typeof GuideTypeSchema>;

/**
 * 📚 Guide / Tutoriel / Procédure lié à un équipement
 */
export const EquipmentGuideSchema = z.object({
  id: z.string(),
  equipmentId: z.string(),
  tenantId: z.string(),
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères'),
  type: GuideTypeSchema,
  url: z.string().url('URL valide requise').optional(),
  authorType: z.enum(['VENDOR', 'RESTAURATEUR', 'COMMUNITY']).default('RESTAURATEUR'),
  authorName: z.string().default('Équipe Restaurant'),
  contentMarkdown: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EquipmentGuide = z.infer<typeof EquipmentGuideSchema>;

/**
 * 🚨 Diagnostic de Panne & Codes d'Erreurs
 */
export const FaultSeveritySchema = z.enum(['minor', 'degraded', 'critical']);
export type FaultSeverity = z.infer<typeof FaultSeveritySchema>;

export const FaultDiagnosticRuleSchema = z.object({
  id: z.string(),
  equipmentCategory: EquipmentCategorySchema,
  brand: z.string().optional(),
  model: z.string().optional(),
  errorCode: z.string().optional(),
  symptom: z.string(),
  possibleCauses: z.array(z.string()),
  quickFixSteps: z.array(z.string()),
  technicianRequired: z.boolean().default(false),
  severity: FaultSeveritySchema.default('degraded'),
  relatedGuideId: z.string().optional(),
});

export type FaultDiagnosticRule = z.infer<typeof FaultDiagnosticRuleSchema>;

/**
 * 🧾 Facture d'Achat & Données Financières
 */
export const EquipmentPurchaseInfoSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, 'Fournisseur requis'),
  invoiceNumber: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
  purchaseDate: z.string(), // ISO Date
  purchasePriceInCents: z.number().int().nonnegative(),
  taxRatePercent: z.number().default(20),
  warrantyDurationMonths: z.number().int().nonnegative().default(24),
  warrantyExpiresAt: z.string(), // ISO Date
  depreciationPeriodYears: z.number().int().default(5),
  pcgAccount: z.string().default('2183'), // Matériel de bureau et informatique / 2184 Mobilier & Matériel
});

export type EquipmentPurchaseInfo = z.infer<typeof EquipmentPurchaseInfoSchema>;

/**
 * 📦 Fiche Complète Équipement Asset 360°
 */
export const EquipmentAssetSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(2, 'Nom requis'),
  category: EquipmentCategorySchema,
  brand: z.string().min(1, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  serialNumber: z.string().min(1, 'Numéro de série requis'),
  location: z.string().default('Cuisine Principale'),
  status: EquipmentStatusSchema.default('OPERATIONAL'),
  photoUrl: z.string().url().optional(),
  qrCodeId: z.string().optional(),
  
  // Financier & Garantie
  purchase: EquipmentPurchaseInfoSchema.optional(),
  
  // Maintenance & Contrôles
  maintenanceFrequencyDays: z.number().int().default(90),
  lastMaintenanceAt: z.string().optional(),
  nextMaintenanceDueAt: z.string(),
  
  // Contact SAV Dédié
  supportContact: z.object({
    companyName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    contractNumber: z.string().optional(),
  }).optional(),

  // Métadonnées
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EquipmentAsset = z.infer<typeof EquipmentAssetSchema>;

/**
 * 📝 Enregistrement d'un incident / panne
 */
export const EquipmentBreakdownSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  equipmentId: z.string(),
  equipmentName: z.string(),
  severity: FaultSeveritySchema,
  errorCode: z.string().optional(),
  symptom: z.string(),
  declaredBy: z.string(),
  declaredAt: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WAITING_PARTS']).default('OPEN'),
  photoUrl: z.string().optional(),
  resolutionNotes: z.string().optional(),
  resolvedAt: z.string().optional(),
  costInMicrounits: z.number().int().optional(),
  partsReplaced: z.array(z.string()).default([]),
});

export type EquipmentBreakdown = z.infer<typeof EquipmentBreakdownSchema>;
