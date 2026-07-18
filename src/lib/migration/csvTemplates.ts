/**
 * CSV Templates — mig-15
 * Fonctions de génération et téléchargement de templates CSV pour l'onboarding.
 * BOM UTF-8 inclus pour compatibilité Excel.
 */

export const CSV_TEMPLATES = {
  staff:
    'prenom,nom,email,telephone,role,pin,taux_horaire,date_embauche\n' +
    'Marie,Dupont,marie@resto.fr,0612345678,serveur,4521,12.50,2024-01-01',

  crm:
    'email,prenom,nom,telephone,nb_visites,derniere_visite,notes,anniversaire\n' +
    'client@email.fr,Jean,Martin,0611111111,5,2024-06-15,Allergique aux noix,1990-03-22',

  suppliers:
    'nom,email,telephone,siret,adresse,categorie,delai_livraison_jours\n' +
    'Metro,contact@metro.fr,0800123456,12345678901234,Paris,Épicerie,2',

  inventory:
    'nom,unite,quantite_stock,seuil_alerte,prix_unitaire_ht_eur,categorie,fournisseur\n' +
    'Tomates,kg,10.5,2,1.20,Légumes,Metro',

  reservations:
    'date,heure,couverts,prenom,nom,email,telephone,notes,statut\n' +
    '2024-01-15,19:30,4,Jean,Martin,jean@email.fr,0611111111,Anniversaire,confirmed',
} as const;

export type CSVTemplateKey = keyof typeof CSV_TEMPLATES;

export function downloadCSVTemplate(
  type: CSVTemplateKey,
  filename?: string
): void {
  const content = '﻿' + CSV_TEMPLATES[type]; // BOM for Excel UTF-8
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `template_${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
