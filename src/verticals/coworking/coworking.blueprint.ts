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
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#6366F1',
      primaryHover: '#4F46E5',
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
      '--desk-reserved': '#6366F1',
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
  precision: 'L1',
  subVariants: [],
};
