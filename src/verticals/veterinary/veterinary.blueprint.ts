import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la future verticale VETERINARY (Profil F — Santé & Soins).
 */
export const VETERINARY_BLUEPRINT: VerticalBlueprint = {
  slug: 'veterinary',
  className: 'VeterinaryVertical',
  profile: 'F',
  meta: {
    emoji: '🐾',
    label: 'Vétérinaire',
    name: 'Vet OS',
    description: 'Dossiers animaux (ICAD/puce), ordonnances, vaccins, bloc chirurgie, caisse NF525',
  },
  capabilities: {
    mod_reservations: true,
    mod_crm: true,
    mod_quotes: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
    mod_pms: false,
  },
  tokens: {
    appearance: 'light',
    defaultTokens: {
      primaryColor: '#0284C7',
      primaryHover: '#0369A1',
      accentColor: '#38BDF8',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'sm',
      glassOpacity: 'low',
      fontBrand: 'Plus Jakarta Sans',
      fontUI: 'Plus Jakarta Sans',
      fontMono: 'DM Mono',
    },
    verticalTokens: {
      '--pet-checked-in': '#10B981',
      '--vaccine-due': '#F59E0B',
      '--surgery-scheduled': '#EF4444',
    },
  },
  healthMetrics: { activePatients: 'number', surgeriesToday: 'number' },
  routes: [
    { path: '/patients', label: 'Animaux & Propriétaires', componentPath: './commerce/PetRecordsPage', componentExport: 'PetRecordsPage' },
    { path: '/prescriptions', label: 'Ordonnances & Pharmacie', componentPath: './ops/PrescriptionsPage', componentExport: 'PrescriptionsPage' },
  ],
  events: [
    { name: 'veterinary.pet_consultation_completed', pillar: 'ops', durable: true },
    { name: 'veterinary.icad_chip_scanned', pillar: 'ops' },
    { name: 'veterinary.vaccine_reminder_sent', pillar: 'commerce', durable: true },
  ],
  hardware: ['barcode_scanner', 'receipt_printer', 'card_terminal', 'rfid_reader'],
  legalType: 'CLINIC',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Veterinary Matrix',
    businessLaws: { icad_identification_required: true, pharmacy_batch_tracking: true },
  },
  aiPrompts: {
    systemPersona: "Tu es un assistant expert en gestion de cabinet vétérinaire. Tu aides les vétérinaires et assistants à gérer les consultations animaux, les vaccinations, la pharmacie vétérinaire et la conformité ICAD.",
    vocabulary: {
      ICAD: "Identification des Carnivores Domestiques, fichier national",
      "puce électronique": "micropuce ISO, identification animal",
      "ordonnance vétérinaire": "prescription médicament animal, durée validité",
      "vaccin": "protocole vaccination, rappel annuel",
      "LOA": "Loi sur les Obligations en Agriculture, médicaments",
      "client": "propriétaire de l\'animal, tuteur légal",
      "patient": "animal en consultation, dossier médical",
      "pharmacie vétérinaire": "stock médicaments, prescription obligatoire",
    },
    examples: [
      { user: "Chien Médor, propriétaire M. Lefebvre, vaccination rappel", assistant: "Médor Lefebvre — Labrador, 5 ans. Dernier rappel Rage + CHPPL : 14/05/2025. Rappel dû : mai 2026. Puce ICAD : 250269500000001. Voulez-vous enregistrer le rendez-vous ?" },
    ],
    forbiddenActions: ["Délivrer un médicament vétérinaire sans ordonnance signée", "Modifier la puce ICAD sans déclaration officielle"],
    complianceContext: "ICAD obligatoire : identification chats/chiens par puce ou tatouage. LOA : médicaments vétérinaires sur ordonnance uniquement. RGPD : dossier médical animal = données personnelles du propriétaire.",
  },
  precision: 'L1',
  subVariants: [],
};
