import type { ConnectorId } from '@/modules/onboarding/migration/connectors/types';
import type { ImportCategory } from '@/modules/onboarding/migration/types';

export interface ExportStep {
  step: number;
  instruction: string;
  note?: string;
}

export interface ExportGuide {
  connectorId: ConnectorId;
  category: ImportCategory;
  title: string;
  intro: string;
  steps: ExportStep[];
  resultFormat: string;
  warningNote?: string;
}

export const EXPORT_GUIDES: ExportGuide[] = [
  // ────── ZELTY ──────
  {
    connectorId: 'zelty',
    category: 'menu',
    title: 'Exporter le menu depuis Zelty',
    intro: "Zelty permet d'exporter votre catalogue produits en CSV depuis le back-office.",
    steps: [
      { step: 1, instruction: "Connectez-vous à votre back-office Zelty (app.zelty.fr)." },
      { step: 2, instruction: "Dans le menu de gauche, cliquez sur « Produits »." },
      { step: 3, instruction: "En haut à droite, cliquez sur le bouton « Exporter »." },
      { step: 4, instruction: "Sélectionnez le format « CSV » et cliquez sur « Télécharger »." },
      { step: 5, instruction: "Déposez le fichier téléchargé dans Restaurant OS.", note: "Les prix sont en centimes — Restaurant OS le détecte automatiquement." },
    ],
    resultFormat: 'CSV (prix en centimes)',
    warningNote: "Les prix Zelty sont toujours en centimes (ex : 1250 = 12,50 €). Restaurant OS convertit automatiquement.",
  },
  {
    connectorId: 'zelty',
    category: 'crm',
    title: 'Exporter les clients depuis Zelty',
    intro: "Exportez votre base clients depuis la section CRM de Zelty.",
    steps: [
      { step: 1, instruction: "Back-office Zelty → section « Clients »." },
      { step: 2, instruction: "Cliquez sur « Exporter les clients » (icône téléchargement)." },
      { step: 3, instruction: "Choisissez la période souhaitée → « CSV »." },
    ],
    resultFormat: 'CSV (email, prénom, nom, téléphone)',
  },

  // ────── L'ADDITION ──────
  {
    connectorId: 'laddition',
    category: 'menu',
    title: "Exporter le menu depuis L'Addition",
    intro: "L'Addition propose un export CSV de votre carte depuis le back-office en ligne.",
    steps: [
      { step: 1, instruction: "Connectez-vous sur my.laddition.com avec vos identifiants." },
      { step: 2, instruction: "Allez dans « Catalogue » → « Produits »." },
      { step: 3, instruction: "Cliquez sur l'icône d'export en haut à droite." },
      { step: 4, instruction: "Choisissez « CSV » → téléchargez.", note: "Le fichier contient Montant TTC en centimes." },
    ],
    resultFormat: 'CSV (Montant TTC en centimes)',
    warningNote: "Colonne « Montant TTC » = centimes. Ex : 1850 = 18,50 €.",
  },

  // ────── LIGHTSPEED ──────
  {
    connectorId: 'lightspeed',
    category: 'menu',
    title: 'Exporter le menu depuis Lightspeed Restaurant',
    intro: "Lightspeed permet un export CSV depuis le back-office ou via son API REST publique.",
    steps: [
      { step: 1, instruction: "Connectez-vous à back-office.lightspeedhq.com." },
      { step: 2, instruction: "Dans la barre latérale, cliquez sur « Articles »." },
      { step: 3, instruction: "Cliquez sur « Exporter tout » (bouton en haut à droite)." },
      { step: 4, instruction: "Choisissez « CSV » ou « XLSX ». Téléchargez." },
      { step: 5, instruction: "Alternative : Settings → Développeurs → API → Générer une clé et collez-la dans Restaurant OS pour un import automatique." },
    ],
    resultFormat: 'CSV ou XLSX (prix en euros)',
  },
  {
    connectorId: 'lightspeed',
    category: 'inventory',
    title: 'Exporter le stock depuis Lightspeed',
    intro: "L'inventaire Lightspeed est exportable depuis la section Stocks.",
    steps: [
      { step: 1, instruction: "Back-office Lightspeed → « Stock » → « Inventaire »." },
      { step: 2, instruction: "Cliquez sur « Exporter » → format CSV." },
    ],
    resultFormat: 'CSV (produit, quantité, valeur)',
  },

  // ────── TILLER ──────
  {
    connectorId: 'tiller',
    category: 'menu',
    title: 'Exporter le menu depuis Tiller (SumUp POS)',
    intro: "Tiller by SumUp propose un export depuis le Manager.",
    steps: [
      { step: 1, instruction: "Connectez-vous sur manager.tillersystems.com." },
      { step: 2, instruction: "Allez dans « Carte » → « Produits »." },
      { step: 3, instruction: "Cliquez sur l'icône d'export et choisissez CSV." },
      { step: 4, instruction: "Les prix apparaissent en centimes. Restaurant OS convertit automatiquement." },
    ],
    resultFormat: 'CSV (prix en centimes)',
    warningNote: "Tiller exporte les prix en centimes.",
  },
  {
    connectorId: 'tiller',
    category: 'staff',
    title: "Exporter l'équipe depuis Tiller",
    intro: "Tiller permet d'exporter la liste des employés.",
    steps: [
      { step: 1, instruction: "Manager Tiller → « Équipe » → « Employés »." },
      { step: 2, instruction: "Cliquez sur « Exporter » → CSV." },
    ],
    resultFormat: 'CSV (prénom, nom, rôle, pin)',
  },

  // ────── ZENCHEF ──────
  {
    connectorId: 'zenchef',
    category: 'reservations',
    title: 'Exporter les réservations depuis Zenchef',
    intro: "Zenchef permet un export CSV depuis le dashboard réservations, ou un pull automatique via API.",
    steps: [
      { step: 1, instruction: "Connectez-vous sur dashboard.zenchef.com." },
      { step: 2, instruction: "Allez dans « Réservations » → « Historique »." },
      { step: 3, instruction: "Sélectionnez la période souhaitée (ex : 12 derniers mois)." },
      { step: 4, instruction: "Cliquez sur « Exporter en CSV »." },
      { step: 5, instruction: "Alternative API : Settings → API → Générer une clé → coller dans Restaurant OS (import auto de tout l'historique)." },
    ],
    resultFormat: 'CSV (date, couverts, client, statut)',
  },
  {
    connectorId: 'zenchef',
    category: 'crm',
    title: 'Exporter les clients depuis Zenchef',
    intro: "La base clients Zenchef est exportable depuis la section CRM.",
    steps: [
      { step: 1, instruction: "Dashboard Zenchef → « Clients »." },
      { step: 2, instruction: "Cliquez sur « Exporter »." },
      { step: 3, instruction: "Choisissez « Tous les clients » → CSV." },
    ],
    resultFormat: 'CSV (email, prénom, nom, visites)',
  },

  // ────── THEFORK ──────
  {
    connectorId: 'thefork',
    category: 'reservations',
    title: 'Exporter les réservations depuis TheFork',
    intro: "TheFork Manager permet un export CSV depuis la section statistiques.",
    steps: [
      { step: 1, instruction: "Connectez-vous sur manager.thefork.com." },
      { step: 2, instruction: "Allez dans « Statistiques » → « Réservations »." },
      { step: 3, instruction: "Sélectionnez la période puis cliquez sur « Exporter en CSV »." },
      { step: 4, instruction: "Importez le fichier dans Restaurant OS." },
    ],
    resultFormat: 'CSV (date, couverts, statut)',
    warningNote: "Les emails TheFork apparaissent masqués (@thefork.com). Restaurant OS les filtre automatiquement et garde les vraies coordonnées si disponibles.",
  },

  // ────── PENNYLANE ──────
  {
    connectorId: 'pennylane',
    category: 'fec',
    title: 'Exporter le FEC depuis Pennylane',
    intro: "Pennylane génère un FEC DGFiP standard depuis la section Exports.",
    steps: [
      { step: 1, instruction: "Connectez-vous sur app.pennylane.com." },
      { step: 2, instruction: "Allez dans « Comptabilité » → « Exports »." },
      { step: 3, instruction: "Sélectionnez « FEC » et choisissez l'exercice comptable." },
      { step: 4, instruction: "Cliquez sur « Générer le FEC » → téléchargez le fichier .txt." },
      { step: 5, instruction: "Alternative API : Intégrations → API → Créer un token → coller dans Restaurant OS." },
    ],
    resultFormat: 'FEC TXT (format DGFiP officiel)',
  },
  {
    connectorId: 'pennylane',
    category: 'statements',
    title: 'Exporter les relevés bancaires depuis Pennylane',
    intro: "Pennylane synchronise automatiquement les relevés bancaires. Exportez-les depuis la trésorerie.",
    steps: [
      { step: 1, instruction: "Pennylane → « Trésorerie » → « Transactions »." },
      { step: 2, instruction: "Filtrez par compte et période." },
      { step: 3, instruction: "Cliquez sur « Exporter » → CSV." },
    ],
    resultFormat: 'CSV (date, libellé, montant, solde)',
  },
];

export function getGuide(connectorId: ConnectorId, category: ImportCategory): ExportGuide | null {
  return EXPORT_GUIDES.find(g => g.connectorId === connectorId && g.category === category) ?? null;
}

export function getGuidesForConnector(connectorId: ConnectorId): ExportGuide[] {
  return EXPORT_GUIDES.filter(g => g.connectorId === connectorId);
}
