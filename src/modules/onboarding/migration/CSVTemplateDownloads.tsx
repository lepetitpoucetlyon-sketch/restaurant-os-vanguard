'use client';

import { Download } from 'lucide-react';
import { downloadCSVTemplate, type CSVTemplateKey } from '@/modules/onboarding/migration/csvTemplates';

interface TemplateInfo {
  key: CSVTemplateKey;
  label: string;
  icon: string;
  description: string;
  columns: string[];
}

const TEMPLATES: TemplateInfo[] = [
  {
    key: 'staff',
    label: 'Équipe / Staff',
    icon: '👥',
    description: 'Importer les membres de votre équipe avec leurs rôles et taux horaires.',
    columns: ['prenom', 'nom', 'email', 'telephone', 'role', 'pin', 'taux_horaire', 'date_embauche'],
  },
  {
    key: 'crm',
    label: 'Clients / CRM',
    icon: '❤️',
    description: 'Base clients avec historique de visites, notes et préférences.',
    columns: ['email', 'prenom', 'nom', 'telephone', 'nb_visites', 'derniere_visite', 'notes', 'anniversaire'],
  },
  {
    key: 'suppliers',
    label: 'Fournisseurs',
    icon: '🚚',
    description: 'Annuaire fournisseurs avec SIRET, délais de livraison et catégories.',
    columns: ['nom', 'email', 'telephone', 'siret', 'adresse', 'categorie', 'delai_livraison_jours'],
  },
  {
    key: 'inventory',
    label: 'Stocks / Inventaire',
    icon: '📦',
    description: 'Ingrédients et produits avec quantités, seuils d\'alerte et prix HT.',
    columns: ['nom', 'unite', 'quantite_stock', 'seuil_alerte', 'prix_unitaire_ht_eur', 'categorie', 'fournisseur'],
  },
  {
    key: 'reservations',
    label: 'Réservations historiques',
    icon: '📅',
    description: 'Historique des réservations passées pour alimenter le CRM.',
    columns: ['date', 'heure', 'couverts', 'prenom', 'nom', 'email', 'telephone', 'notes', 'statut'],
  },
];

export default function CSVTemplateDownloads() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-text-primary">Templates CSV</h2>
        <p className="text-sm text-text-muted mt-1">
          Téléchargez un template pré-rempli, complétez-le avec vos données, puis glissez-déposez dans la section Import correspondante.
          Encodage UTF-8 avec BOM pour compatibilité Excel.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.key}
            className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label={tpl.label}>{tpl.icon}</span>
                <h3 className="font-semibold text-text-primary text-sm">{tpl.label}</h3>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">{tpl.description}</p>

            <div className="flex flex-wrap gap-1">
              {tpl.columns.map((col) => (
                <span
                  key={col}
                  className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono bg-bg-tertiary text-text-muted border border-border"
                >
                  {col}
                </span>
              ))}
            </div>

            <button
              onClick={() => downloadCSVTemplate(tpl.key)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors px-3 py-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Télécharger template
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-text-muted space-y-1">
        <p className="font-medium text-text-primary">Conseils d'utilisation</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Ouvrez le fichier CSV dans Excel ou Google Sheets.</li>
          <li>Remplacez les lignes d'exemple par vos données réelles (conservez les en-têtes).</li>
          <li>Enregistrez en CSV UTF-8 avant de l'importer.</li>
          <li>Les colonnes non reconnues sont ignorées sans erreur.</li>
        </ul>
      </div>
    </div>
  );
}
