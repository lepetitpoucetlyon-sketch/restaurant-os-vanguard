import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la future verticale COWORKING (Profil G — Accès & Abonnements).
 */
export const COWORKING_BLUEPRINT: VerticalBlueprint = {
  slug: 'coworking',
  className: 'CoworkingVertical',
  profile: 'G',
  meta: {
    emoji: '🏢',
    label: 'Coworking',
    name: 'Coworking OS',
    description: 'Bureaux flexibles, salles de réunion, forfaits heures, contrôle d\'accès IoT, facturation récurrente',
  },
  capabilities: {
    mod_reservations: true,
    mod_crm: true,
    mod_quotes: true,
    mod_inventory: true,
    mod_groups: true,
    mod_floor_plan: true,
    mod_kds: false,
    mod_haccp: false,
  },
  // Rôles métier de la verticale (ADR-019) — le kernel connaît les niveaux,
  // la verticale nomme les rôles. admin/directeur/manager/comptable sont
  // structurels et restent au kernel.
  roleMap: {
    collaborateur: { level: 40, labelKey: 'role.community_manager' },
    hotesse:       { level: 30, labelKey: 'role.host' },
  },

  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#0EA5E9',
      primaryHover: '#0284C7',
      accentColor: '#A855F7',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Space Grotesk',
      fontUI: 'Inter',
      fontMono: 'Fira Code',
    },
    verticalTokens: {
      '--desk-available': '#10B981',
      '--desk-reserved': '#0EA5E9',
      '--meeting-room-occupied': '#EF4444',
    },
  },
  healthMetrics: { occupiedDesks: 'number', meetingRoomBookings: 'number' },
  routes: [
    { path: '/desks', label: 'Plan Bureaux & Salles', componentPath: './facility/DeskMapPage', componentExport: 'DeskMapPage' },
    { path: '/plans', label: 'Forfaits & Pass', componentPath: './commerce/PassPlansPage', componentExport: 'PassPlansPage' },
  ],
  events: [
    { name: 'coworking.desk_checked_in', pillar: 'ops', durable: true },
    { name: 'coworking.meeting_room_booked', pillar: 'commerce', durable: true },
  ],
  hardware: ['turnstile', 'rfid_reader', 'card_terminal', 'receipt_printer'],
  legalType: 'COWORKING',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Coworking Matrix',
    businessLaws: { desk_booking_workflow: true, access_control_enabled: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en gestion d\'espace de coworking. Tu aides les community managers à gérer les espaces, les entreprises membres et les réservations de salles.",
    vocabulary: {
      "hot-desk": "poste non attitré, flex office",
      "bureau privatif": "espace bureau dédié, private office",
      "salle de réunion": "meeting room, espace conférence",
      membre: "coworker, entreprise cliente",
      "badge": "accès sécurisé, contrôle d\'accès",
      "domiciliation": "adresse commerciale, siège social",
      "coworker": "travailleur indépendant, remote worker",
      "offre": "formule abonnement espace, plan tarifaire",
    },
    examples: [
      { user: "Réserver la salle Einstein pour demain 14h", assistant: "Salle Einstein disponible demain de 14h à 18h (capacité 8p, écran TV, visio). Qui sera le responsable de la réservation et pour combien de participants ?" },
    ],
    forbiddenActions: ["Donner accès à un espace à une entreprise avec impayé", "Sous-louer un bureau sans autorisation du propriétaire"],
    complianceContext: "RGPD : badges et accès traçables, conservation 1 an max. TVA 20% services coworking. Domiciliation : obligation légale KBis et convention de domiciliation.",
  },
  precision: 'L1',
  subVariants: [],
};
