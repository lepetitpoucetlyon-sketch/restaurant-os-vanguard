import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale RESTAURANT (Profil A — Food & Périssable).
 */
export const RESTAURANT_BLUEPRINT: VerticalBlueprint = {
  slug: 'restaurant',
  className: 'RestaurantVertical',
  profile: 'A',
  meta: {
    emoji: '🍽️',
    label: 'Restaurant',
    name: 'Restaurant OS',
    description: 'Service en salle, plan de table, KDS multi-stations, HACCP, caisse NF525',
  },
  capabilities: {
    mod_floor_plan: true,
    mod_kds: true,
    mod_kitchen_management: true,
    mod_haccp: true,
    mod_hygiene: true,
    mod_quality_control: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_reservations: true,
    mod_marketing: true,
    mod_pms: false,
  },
  tokens: {
    // Aligné sur restaurantDefaultTokens (shared/nexus/tokens/verticals/restaurant.ts) —
    // le blueprint déclarait auparavant une palette indigo/violet #6366f1 / #8b5cf6
    // (pattern "AI Purple" banni par taste-skill) alors que le vrai brand est or.
    // Les valeurs ci-dessous sont canoniques : le tenant peut les surcharger via
    // BrandingService, mais aucun démarrage restaurant ne doit jamais montrer d'indigo.
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#C5A059',
      primaryHover: '#B08D48',
      accentColor: '#C5A059',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'md',
      glassBlur: 'md',
      glassOpacity: 'high',
      fontBrand: 'Instrument Serif',
      fontUI: 'Outfit',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--table-available': '#e5e7eb',
      '--table-occupied': '#1e293b',
      '--table-reserved': '#fbbf24',
      '--table-bill-printed': '#0ea5e9',
      '--course-order-sent': '#C5A059',
      '--course-next-fired': '#ec4899',
    },
  },
  healthMetrics: { tablesActive: 'number', coversToday: 'number' },
// PLAN LOGIQUE MÉTIER LOT H : la verticale restaurant est écrite à la main
  // (référence produit), pas générée par la forge. Les vraies routes vivent
  // dans RestaurantVertical.ts (componentLoader dynamique). Ce blueprint est
  // conservé pour les métadonnées (tokens, healthMetrics, DNA overrides, IA)
  // consommées par MCC/Sector Studio, mais routes[] est intentionnellement vide.
  routes: [],
// PLAN LOGIQUE MÉTIER LOT H : 4 événements 'restaurant.*' étaient déclarés
  // mais jamais émis (0 émetteur mesuré). La chaîne réelle passe par les
  // événements ops.* / order.* / reservation.* du bus canonique. Retiré pour
  // éviter d'induire en erreur les générateurs (forge, sector-study, MCC).
  events: [],
  hardware: ['receipt_printer', 'kitchen_printer', 'cash_drawer', 'card_terminal', 'barcode_scanner'],
  legalType: 'RESTAURANT',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Restaurant Complete Matrix',
    businessLaws: { table_service_enabled: true, kds_routing_enabled: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en gestion de restaurant. Tu aides les opérateurs et serveurs à gérer le service en salle, les commandes cuisine, les réservations et la caisse NF525.",
    vocabulary: {
      table: "table de restaurant, couverts",
      ticket: "ticket de caisse, addition",
      service: "service en salle, plein service",
      coursing: "envoi en cuisine, cours du repas",
      KDS: "Kitchen Display System, afficheur cuisine",
      couvert: "assiette de service, couvert mis",
      réservation: "réservation de table, booking",
      HACCP: "Hazard Analysis Critical Control Points, traçabilité hygiène",
    },
    examples: [
      { user: "La table 12 veut la carte des vins", assistant: "Table 12 demande la carte des vins. Je peux vous afficher la sélection actuelle ou enregistrer la demande dans le KDS." },
      { user: "Fermer le ticket de la table 5", assistant: "Je ferme le ticket de la table 5. Quel mode de règlement ? CB, espèces, ou ticket restaurant ?" },
    ],
    forbiddenActions: ["Modifier le prix d\'un article sans autorisation manager", "Annuler une ligne de commande déjà envoyée en cuisine sans justification"],
    complianceContext: "Caisse NF525 obligatoire : toute transaction doit être enregistrée et un justificatif fiscal émis. HACCP : traçabilité des températures et DLC obligatoire.",
  },
  precision: 'L3',
  subVariants: [
    {
      slug: 'bar_tapas',
      label: 'Bar & Tapas',
      description: 'Mode One-Tap POS, tireuses connectées SmartSpout, Happy Hour dynamique.',
      capabilities: { mod_bar: true, mod_pos: true },
    },
    {
      slug: 'brasserie',
      label: 'Brasserie',
      description: 'Débit élevé, service continu, rush intense.',
      capabilities: { mod_kiosk: true },
    },
    {
      slug: 'gastronomique',
      label: 'Gastronomique',
      description: 'Accords mets-vins, réservations avec arrhes, coursing multi-étapes.',
      capabilities: { mod_quotes: true },
    },
  ],
};
