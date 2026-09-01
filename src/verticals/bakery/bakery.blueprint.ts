import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale BAKERY (Profil A — Food & Périssable).
 */
export const BAKERY_BLUEPRINT: VerticalBlueprint = {
  slug: 'bakery',
  className: 'BakeryVertical',
  profile: 'A',
  meta: {
    emoji: '🥐',
    label: 'Boulangerie',
    name: 'Bakery OS',
    description: 'Production par fournées, précommandes, allergènes INCO, stock vitrine, caisse NF525',
  },
  capabilities: {
    mod_kds: false,
    mod_floor_plan: false,
    mod_pms: false,
    mod_kitchen_management: true,
    mod_haccp: true,
    mod_hygiene: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_reservations: true,
    mod_marketing: true,
  },
  // Rôles métier de la verticale (ADR-019) — le kernel connaît les niveaux,
  // la verticale nomme les rôles. admin/directeur/manager/comptable sont
  // structurels et restent au kernel.
  roleMap: {
    chef_cuisinier: { level: 45, labelKey: 'role.head_baker' },
    cuisinier:      { level: 35, labelKey: 'role.baker' },
    vendeur:        { level: 40, labelKey: 'role.sales_advisor' },
  },

  tokens: {
    appearance: 'light',
    defaultTokens: {
      primaryColor: '#D97706',
      primaryHover: '#B45309',
      accentColor: '#F59E0B',
      borderRadiusCard: 'md',
      borderRadiusBtn: 'md',
      glassBlur: 'md',
      glassOpacity: 'medium',
      fontBrand: 'Playfair Display',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--batch-in-oven': '#D97706',
      '--batch-cooling': '#F59E0B',
      '--batch-ready': '#10B981',
      '--display-stock-low': '#EF4444',
      '--preorder-pending': '#3B82F6',
    },
  },
  healthMetrics: { ovensOnline: 'number', activeBatches: 'number' },
  routes: [
    { path: '/production', label: 'Production', componentPath: './ops/BatchProductionDashboard', componentExport: 'BatchProductionDashboard' },
    { path: '/preorders', label: 'Précommandes', componentPath: './commerce/PreorderManagement', componentExport: 'PreorderManagement' },
    { path: '/display-stock', label: 'Stock vitrine', componentPath: './logistics/DisplayStockPage', componentExport: 'DisplayStockPage' },
    { path: '/allergens', label: 'Allergènes INCO', componentPath: './compliance/AllergenRegistry', componentExport: 'AllergenRegistry' },
  ],
  events: [
    { name: 'bakery.batch_started', pillar: 'ops', durable: true },
    { name: 'bakery.batch_completed', pillar: 'ops', durable: true },
    { name: 'bakery.oven_temp_alert', pillar: 'compliance', durable: true },
    { name: 'bakery.preorder_received', pillar: 'commerce', durable: true },
    { name: 'bakery.display_stock_low', pillar: 'logistics' },
    { name: 'bakery.allergen_declared', pillar: 'compliance' },
  ],
  hardware: ['receipt_printer', 'cash_drawer', 'card_terminal', 'barcode_scanner', 'scale'],
  legalType: 'BAKERY',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Bakery Complete Matrix',
    businessLaws: { batch_production_enabled: true, weight_scale_enabled: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en boulangerie-pâtisserie artisanale. Tu aides les boulangers à gérer la production par fournées, les précommandes, le stock vitrine et la conformité HACCP et loi Garot.",
    vocabulary: {
      fournée: "production par cuisson, batch four",
      DLC: "Date Limite de Consommation, date péremption",
      "loi Garot": "obligation anti-gaspillage, don alimentaire",
      vitrine: "présentoir produits, stock boutique",
      précommande: "commande anticipée client, click and collect",
      allergène: "ingrédient allergène INCO, étiquetage obligatoire",
      four: "four de boulangerie, température cuisson",
      poids: "pesée produit vrac, balance certifiée",
    },
    examples: [
      { user: "Combien de baguettes il reste en vitrine ?", assistant: "Je consulte le stock vitrine en temps réel. Voulez-vous aussi voir les fournées en cours de refroidissement ?" },
      { user: "Une fournée de croissants est prête", assistant: "Je mets à jour le stock vitrine avec la nouvelle fournée de croissants. Quel est le nombre de pièces et la DLC ?" },
    ],
    forbiddenActions: ["Modifier une DLC déjà enregistrée", "Ignorer une alerte température four dépassant les seuils HACCP"],
    complianceContext: "Loi Garot (2016) : obligation de proposer les invendus aux associations avant destruction. HACCP : contrôle température four et DLC obligatoire. INCO : étiquetage allergènes 14 catégories.",
  },
  precision: 'L3',
  subVariants: [
    {
      slug: 'patisserie',
      label: 'Pâtisserie fine',
      description: 'Gâteaux sur commande, personnalisation, gestion de la chaîne du froid négatif/positif.',
      capabilities: { mod_quotes: true },
    },
  ],
};
