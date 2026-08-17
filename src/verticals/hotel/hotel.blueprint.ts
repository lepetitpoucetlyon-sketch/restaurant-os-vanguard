import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale HOTEL (Profil E — Hébergement PMS).
 */
export const HOTEL_BLUEPRINT: VerticalBlueprint = {
  slug: 'hotel',
  className: 'HotelVertical',
  profile: 'E',
  meta: {
    emoji: '🏨',
    label: 'Hôtel',
    name: 'Hotel OS',
    description: 'Planning chambres, check-in/out, Channel Manager, taxe de séjour, facturation consolidée',
  },
  capabilities: {
    mod_pms: true,
    mod_reservations: true,
    mod_groups: true,
    mod_floor_plan: true,
    mod_crm: true,
    mod_marketing: true,
    mod_inventory: true,
    mod_kds: false,
    mod_haccp: false,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#0EA5E9',
      primaryHover: '#0284C7',
      accentColor: '#38BDF8',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Cinzel',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--room-available': '#10B981',
      '--room-occupied': '#0EA5E9',
      '--room-cleaning': '#F59E0B',
      '--room-maintenance': '#EF4444',
      '--checkin-due': '#8B5CF6',
    },
  },
  healthMetrics: { occupancyRate: 'number', roomsCheckedIn: 'number' },
  routes: [
    { path: '/rooms', label: 'Planning Chambres', componentPath: './ops/RoomGridPage', componentExport: 'RoomGridPage' },
    { path: '/check-in', label: 'Check-in / Out', componentPath: './ops/CheckInDesk', componentExport: 'CheckInDesk' },
    { path: '/housekeeping', label: 'Gouvernance', componentPath: './facility/HousekeepingPage', componentExport: 'HousekeepingPage' },
  ],
  events: [
    { name: 'hotel.guest_checked_in', pillar: 'ops', durable: true },
    { name: 'hotel.guest_checked_out', pillar: 'ops', durable: true },
    { name: 'hotel.room_status_changed', pillar: 'facility', durable: true },
    { name: 'hotel.channel_booking_received', pillar: 'commerce', durable: true },
  ],
  hardware: ['receipt_printer', 'badge_encoder', 'card_terminal', 'barcode_scanner'],
  legalType: 'HOTEL',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Hotel Complete Matrix',
    businessLaws: { pms_enabled: true, city_tax_calculation: true },
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'resort',
      label: 'Resort & Spa',
      description: 'Hôtel avec activités, soins et restauration intégrée.',
      capabilities: { mod_haccp: true, mod_kds: true },
    },
  ],
};
