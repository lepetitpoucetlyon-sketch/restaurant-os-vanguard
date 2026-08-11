import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';

import type { ImportCategory } from '@nexus/contracts';
export type { ImportCategory } from '@nexus/contracts';

export type FileFormat = 'csv' | 'xlsx' | 'pdf' | 'image' | 'json' | 'text' | 'fec';

export type SourceSystem =
  | 'zenchef'
  | 'thefork'
  | 'laddition'
  | 'zelty'
  | 'lightspeed'
  | 'generic';

export type ImportStage =
  | 'idle'
  | 'reading'
  | 'detecting'
  | 'mapping'
  | 'previewing'
  | 'importing'
  | 'done'
  | 'error';

export type ParsedRow = Record<string, string>;

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ParsedFile {
  format: FileFormat;
  source: SourceSystem;
  headers: string[];
  rows: ParsedRow[];
  warnings: ImportWarning[];
  encoding?: string;
  separator?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface TargetField {
  key: string;
  label: string;
  required: boolean;
  description?: string;
}

export interface CategoryConfig {
  label: string;
  icon: string;
  description: string;
  acceptedFormats: FileFormat[];
  targetFields: TargetField[];
  acceptsPaste: boolean;
  requiresOrder?: ImportCategory[];
}

export const CATEGORY_CONFIGS: Record<ImportCategory, CategoryConfig> = {
  menu: {
    label: 'Menu / Carte',
    icon: '🍽️',
    description: 'Carte PDF, photo menu, texte, CSV Zelty/L\'Addition',
    acceptedFormats: ['csv', 'xlsx', 'pdf', 'image', 'json', 'text'],
    acceptsPaste: true,
    targetFields: [
      { key: 'name', label: 'Nom du plat', required: true },
      { key: 'categoryName', label: 'Catégorie', required: true },
      { key: 'price', label: 'Prix (€)', required: true, description: 'L\'Addition/Zelty : centimes détectés auto' },
      { key: 'description', label: 'Description', required: false },
      { key: 'taxRate', label: 'TVA (%)', required: false, description: 'Défaut : 10%' },
    ],
  },
  staff: {
    label: 'Équipe / Staff',
    icon: '👥',
    description: 'Excel maison, export Zenchef, CSV RH',
    acceptedFormats: ['csv', 'xlsx'],
    acceptsPaste: false,
    targetFields: [
      { key: 'name', label: 'Nom complet', required: true },
      { key: 'role', label: 'Rôle', required: true, description: 'FR ou EN acceptés (Serveur = serveur)' },
      { key: 'email', label: 'Email', required: false },
      { key: 'phone', label: 'Téléphone', required: false },
      { key: 'pin', label: 'PIN (4 chiffres)', required: false, description: 'Généré aléatoirement si absent' },
      { key: 'hourlyRate', label: 'Taux horaire (€)', required: false },
    ],
  },
  crm: {
    label: 'Clients / CRM',
    icon: '❤️',
    description: 'Export TheFork, Zenchef, Excel fidélité',
    acceptedFormats: ['csv', 'xlsx'],
    acceptsPaste: false,
    targetFields: [
      { key: 'firstName', label: 'Prénom', required: false },
      { key: 'lastName', label: 'Nom', required: false },
      { key: 'email', label: 'Email', required: false, description: 'Clé de déduplication' },
      { key: 'phone', label: 'Téléphone', required: false },
      { key: 'totalVisits', label: 'Nb visites', required: false },
      { key: 'lastVisit', label: 'Dernière visite', required: false },
      { key: 'notes', label: 'Notes', required: false },
      { key: 'optout', label: 'Désinscription marketing', required: false },
    ],
  },
  suppliers: {
    label: 'Fournisseurs',
    icon: '🚚',
    description: 'Excel maison, liste fournisseurs',
    acceptedFormats: ['csv', 'xlsx'],
    acceptsPaste: false,
    targetFields: [
      { key: 'name', label: 'Nom fournisseur', required: true },
      { key: 'email', label: 'Email commande', required: false },
      { key: 'phone', label: 'Téléphone', required: false },
      { key: 'deliveryDays', label: 'Délai livraison (jours)', required: false },
      { key: 'paymentTerms', label: 'Conditions de paiement', required: false },
    ],
  },
  inventory: {
    label: 'Stocks / Inventaire',
    icon: '📦',
    description: 'Excel inventaire, logiciel caisse, comptage papier',
    acceptedFormats: ['csv', 'xlsx', 'image'],
    acceptsPaste: false,
    targetFields: [
      { key: 'name', label: 'Ingrédient / Produit', required: true },
      { key: 'quantity', label: 'Quantité', required: true },
      { key: 'unit', label: 'Unité (kg/g/l/cl…)', required: true },
      { key: 'dlc', label: 'DLC', required: false, description: 'Formats : JJ/MM/AAAA, AAAA-MM-JJ' },
      { key: 'zone', label: 'Zone stockage', required: false },
      { key: 'unitCost', label: 'Coût unitaire (€)', required: false },
      { key: 'supplier', label: 'Fournisseur', required: false },
    ],
  },
  recipes: {
    label: 'Recettes / Fiches techniques',
    icon: '📋',
    description: 'PDF fiches recettes, photos, Excel maison',
    acceptedFormats: ['csv', 'xlsx', 'pdf', 'image', 'json'],
    acceptsPaste: true,
    requiresOrder: ['inventory'],
    targetFields: [
      { key: 'name', label: 'Nom de la recette', required: true },
      { key: 'ingredientName', label: 'Ingrédient', required: true },
      { key: 'quantity', label: 'Quantité', required: true },
      { key: 'unit', label: 'Unité', required: true },
      { key: 'steps', label: 'Étapes', required: false },
    ],
  },
  reservations: {
    label: 'Réservations historiques',
    icon: '📅',
    description: 'Export Zenchef / TheFork — alimente le CRM uniquement',
    acceptedFormats: ['csv', 'xlsx'],
    acceptsPaste: false,
    requiresOrder: ['crm'],
    targetFields: [
      { key: 'date', label: 'Date réservation', required: true },
      { key: 'time', label: 'Heure', required: false },
      { key: 'covers', label: 'Nombre de couverts', required: false },
      { key: 'firstName', label: 'Prénom client', required: false },
      { key: 'lastName', label: 'Nom client', required: false },
      { key: 'email', label: 'Email client', required: false, description: 'Lien vers CRM' },
      { key: 'phone', label: 'Téléphone', required: false },
      { key: 'source', label: 'Source (Zenchef, Walk-in…)', required: false },
    ],
  },
  statements: {
    label: 'Relevés bancaires',
    icon: '🏦',
    description: 'Export CSV banque, PDF relevé',
    acceptedFormats: ['csv', 'xlsx', 'pdf'],
    acceptsPaste: false,
    targetFields: [
      { key: 'date', label: 'Date opération', required: true },
      { key: 'label', label: 'Libellé', required: true },
      { key: 'amount', label: 'Montant (€)', required: true, description: 'Négatif = débit, positif = crédit' },
      { key: 'pcgAccount', label: 'Compte PCG', required: false },
    ],
  },
  fec: {
    label: 'FEC exercice précédent',
    icon: '⚖️',
    description: 'Fichier TXT DGFiP fourni par l\'expert-comptable',
    acceptedFormats: ['fec', 'csv', 'text'],
    acceptsPaste: false,
    targetFields: [
      { key: 'JournalCode', label: 'Code journal', required: true },
      { key: 'EcritureDate', label: 'Date écriture', required: true },
      { key: 'CompteNum', label: 'N° compte PCG', required: true },
      { key: 'Debit', label: 'Débit', required: true },
      { key: 'Credit', label: 'Crédit', required: true },
    ],
  },
  floorplan: {
    label: 'Plan de salle',
    icon: '🗺️',
    description: 'JSON layout, CSV tables, ou saisie guidée',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    acceptsPaste: false,
    targetFields: [
      { key: 'number', label: 'Numéro de table', required: true },
      { key: 'capacity', label: 'Capacité (couverts)', required: true },
      { key: 'zone', label: 'Zone / Salle', required: false },
      { key: 'shape', label: 'Forme (round/rect)', required: false },
    ],
  },
  haccp_history: {
    label: 'Historique HACCP',
    icon: '🌡️',
    description: 'Registres températures (CSV logiciel HACCP, Excel, scan papier)',
    acceptedFormats: ['csv', 'xlsx', 'pdf', 'image'],
    acceptsPaste: false,
    targetFields: [
      { key: 'date', label: 'Date', required: true },
      { key: 'time', label: 'Heure', required: false },
      { key: 'zone', label: 'Zone / Équipement', required: true },
      { key: 'temperature', label: 'Température (°C)', required: true },
      { key: 'operator', label: 'Opérateur', required: false },
      { key: 'notes', label: 'Notes / Commentaire', required: false },
    ],
  },
};

export const KNOWN_ROLES: PermissionRole[] = [
  'super_admin', 'directeur', 'manager', 'comptable',
  'chef_rang', 'chef_cuisinier', 'serveur', 'cuisinier',
  'barman', 'hotesse', 'plongeur',
];
