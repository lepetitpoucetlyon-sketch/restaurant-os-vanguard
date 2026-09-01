import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale RETAIL (Profil D — Retail & Variantes).
 */
export const RETAIL_BLUEPRINT: VerticalBlueprint = {
  slug: 'retail',
  className: 'RetailVertical',
  profile: 'D',
  meta: {
    emoji: '🛍️',
    label: 'Retail',
    name: 'Retail OS',
    description: 'Matrice de variantes (taille/couleur), scan douchette 2D, e-commerce sync, étiquettes prix',
  },
  capabilities: {
    mod_inventory: true,
    mod_storage_map: true,
    mod_omnichannel: true,
    mod_crm: true,
    mod_marketing: true,
    mod_social_marketing: true,
    mod_seo: true,
    mod_kiosk: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
  },
  // Rôles métier de la verticale (ADR-019) — le kernel connaît les niveaux,
  // la verticale nomme les rôles. admin/directeur/manager/comptable sont
  // structurels et restent au kernel.
  roleMap: {
    vendeur: { level: 40, labelKey: 'role.sales_advisor' },
    hotesse: { level: 30, labelKey: 'role.host' },
  },

  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#EC4899',
      primaryHover: '#DB2777',
      accentColor: '#F43F5E',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Outfit',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--sku-in-stock': '#10B981',
      '--sku-low-stock': '#F59E0B',
      '--sku-out-of-stock': '#EF4444',
      '--scan-success': '#10B981',
    },
  },
  healthMetrics: { totalSkus: 'number', lowStockSkus: 'number' },
  routes: [
    { path: '/catalog/matrix', label: 'Matrice Variantes', componentPath: './commerce/VariantMatrixPage', componentExport: 'VariantMatrixPage' },
    { path: '/inventory/scan', label: 'Scan Douchette', componentPath: './logistics/BarcodeScanPage', componentExport: 'BarcodeScanPage' },
  ],
  events: [
    { name: 'retail.barcode_scanned', pillar: 'ops' },
    { name: 'retail.variant_stock_adjusted', pillar: 'logistics', durable: true },
    { name: 'retail.ecommerce_synced', pillar: 'commerce', durable: true },
  ],
  hardware: ['barcode_scanner', 'receipt_printer', 'cash_drawer', 'card_terminal', 'label_printer'],
  legalType: 'RETAIL',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Retail Complete Matrix',
    businessLaws: { barcode_scanning_required: true, matrix_variants_enabled: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en commerce de détail. Tu aides les vendeurs et responsables à gérer les SKU, les stocks, les étiquettes prix et la caisse.",
    vocabulary: {
      SKU: "Stock Keeping Unit, référence produit unique",
      EAN: "European Article Number, code-barres",
      "portant": "présentoir vêtements, rack",
      "inventaire": "comptage stock physique, inventaire tournant",
      PGC: "Produits de Grande Consommation, fast-moving",
      "soldes": "période légale de soldes, remises réglementées",
      "retour": "retour client, remboursement ou échange",
      PLV: "Publicité sur Lieu de Vente, matériel promo",
    },
    examples: [
      { user: "Le produit EAN 3760000000001 est épuisé", assistant: "Rupture de stock EAN 3760000000001 détectée. Je déclenche une alerte réapprovisionnement et mets à jour la disponibilité en ligne." },
    ],
    forbiddenActions: ["Modifier un prix affiché sans valider l\'étiquette légale", "Vendre un produit sans code EAN enregistré"],
    complianceContext: "Loi Hamon : droit de rétractation 14 jours e-commerce. Soldes réglementées par décret préfectoral. Affichage prix obligatoire TTC.",
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'mode',
      label: 'Prêt-à-porter',
      description: 'Gestion collections saisons, retours cabine, programmes VIP.',
      capabilities: { mod_groups: true },
    },
  ],
};
