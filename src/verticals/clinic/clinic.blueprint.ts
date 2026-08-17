import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale CLINIC (Profil F — Santé & Soins).
 */
export const CLINIC_BLUEPRINT: VerticalBlueprint = {
  slug: 'clinic',
  className: 'ClinicVertical',
  profile: 'F',
  meta: {
    emoji: '🏥',
    label: 'Clinique',
    name: 'Clinic OS',
    description: 'Dossier patient chiffré AES-256-GCM, télétransmission SESAM-Vitale, CCAM, agenda praticiens',
  },
  capabilities: {
    mod_reservations: true,
    mod_crm: true,
    mod_quotes: true,
    mod_inventory: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
    mod_pms: false,
  },
  tokens: {
    appearance: 'light',
    defaultTokens: {
      primaryColor: '#059669',
      primaryHover: '#047857',
      accentColor: '#10B981',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'sm',
      glassOpacity: 'low',
      fontBrand: 'Plus Jakarta Sans',
      fontUI: 'Plus Jakarta Sans',
      fontMono: 'DM Mono',
    },
    verticalTokens: {
      '--patient-waiting': '#F59E0B',
      '--patient-consulting': '#059669',
      '--patient-discharged': '#10B981',
      '--prescription-signed': '#3B82F6',
    },
  },
  healthMetrics: { practitionersOnline: 'number', consultationsToday: 'number' },
  routes: [
    { path: '/consultations', label: 'Consultations', componentPath: './ops/ConsultationsPage', componentExport: 'ConsultationsPage' },
    { path: '/patients', label: 'Dossiers Patients', componentPath: './commerce/PatientRecordsPage', componentExport: 'PatientRecordsPage' },
  ],
  events: [
    { name: 'clinic.consultation_started', pillar: 'ops', durable: true },
    { name: 'clinic.consultation_completed', pillar: 'ops', durable: true },
    { name: 'clinic.prescription_issued', pillar: 'ops', durable: true },
  ],
  hardware: ['card_terminal', 'receipt_printer', 'barcode_scanner'],
  legalType: 'CLINIC',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Clinic Complete Matrix',
    businessLaws: { patient_data_encryption: true, ccam_billing_enabled: true },
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'dentiste',
      label: 'Cabinet Dentaire',
      description: 'Schéma dentaire, devis prothèses, traçabilité stérilisation.',
      capabilities: { mod_quotes: true },
    },
  ],
};
