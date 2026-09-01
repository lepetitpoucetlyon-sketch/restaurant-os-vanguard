import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale GARAGE (Profil C — Atelier & Technique).
 */
export const GARAGE_BLUEPRINT: VerticalBlueprint = {
  slug: 'garage',
  className: 'GarageVertical',
  profile: 'C',
  meta: {
    emoji: '🔧',
    label: 'Garage',
    name: 'Garage OS',
    description: 'Ordres de réparation (OR), immatriculation SIV, pièces TecDoc, devis, caisse NF525',
  },
  capabilities: {
    mod_reservations: true,
    mod_quotes: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_crm: true,
    mod_registre: true,
    mod_kds: false,
    mod_haccp: false,
    mod_pms: false,
    mod_floor_plan: false,
  },
  // Rôles métier de la verticale (ADR-019) — le kernel connaît les niveaux,
  // la verticale nomme les rôles. admin/directeur/manager/comptable sont
  // structurels et restent au kernel.
  roleMap: {
    chef_atelier:   { level: 50, labelKey: 'role.workshop_manager' },
    mecanicien:     { level: 40, labelKey: 'role.mechanic' },
    receptionnaire: { level: 40, labelKey: 'role.service_advisor' },
  },

  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#EA580C',
      primaryHover: '#C2410C',
      accentColor: '#F97316',
      borderRadiusCard: 'md',
      borderRadiusBtn: 'md',
      glassBlur: 'md',
      glassOpacity: 'high',
      fontBrand: 'Oswald',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--lift-available': '#10B981',
      '--lift-occupied': '#EA580C',
      '--or-draft': '#9CA3AF',
      '--or-in-progress': '#F97316',
      '--or-completed': '#10B981',
    },
  },
  healthMetrics: { baysActive: 'number', openRepairOrders: 'number' },
  routes: [
    { path: '/workshop', label: 'Atelier', componentPath: './ops/WorkshopPlanningPage', componentExport: 'WorkshopPlanningPage' },
    { path: '/repair-orders', label: 'Ordres de Réparation', componentPath: './ops/RepairOrdersPage', componentExport: 'RepairOrdersPage' },
    { path: '/parts-catalog', label: 'Catalogue Pièces', componentPath: './logistics/PartsCatalogPage', componentExport: 'PartsCatalogPage' },
  ],
  events: [
    { name: 'garage.repair_order_created', pillar: 'ops', durable: true },
    { name: 'garage.repair_order_completed', pillar: 'ops', durable: true },
    { name: 'garage.vehicle_siv_inspected', pillar: 'ops' },
    { name: 'garage.part_ordered', pillar: 'logistics', durable: true },
  ],
  hardware: ['receipt_printer', 'barcode_scanner', 'card_terminal'],
  legalType: 'GARAGE',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Garage Complete Matrix',
    businessLaws: { vehicle_registration_required: true, repair_order_workflow: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en garage automobile et réparation. Tu aides les mécaniciens et réceptionnaires à gérer les ordres de réparation, les pièces détachées, et la conformité Trackdéchets.",
    vocabulary: {
      OR: "Ordre de Réparation, fiche travaux",
      "pièce détachée": "pièce auto, référence constructeur",
      "Trackdéchets": "traçabilité déchets dangereux, huiles usagées",
      carrosserie: "réparation carrosserie, peinture",
      diagnostic: "diagnostic électronique OBD, code défaut",
      "contrôle technique": "CT obligatoire, vignette",
      atelier: "poste de travail mécanique, bay",
      VHU: "Véhicule Hors Usage, épave",
    },
    examples: [
      { user: "Le client attend la vidange de la Peugeot 308", assistant: "Je checke l\'OR de la Peugeot 308. Huile préconisée : 5W-30 ACEA C3. Stock huile OK. Durée estimée : 45 min. Le mécanicien en bay 3 peut commencer." },
    ],
    forbiddenActions: ["Facturer des pièces non montées", "Ignorer un code défaut critique sans informer le client"],
    complianceContext: "Trackdéchets obligatoire pour huiles usagées et filtres. Loi Macron : devis signé obligatoire avant intervention. TVA récupérable sur pièces.",
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'carrosserie',
      label: 'Carrosserie & Peinture',
      description: 'Gestion expertise assurance, chiffrage pièces, cabine de peinture.',
      capabilities: { mod_quotes: true },
    },
  ],
};
