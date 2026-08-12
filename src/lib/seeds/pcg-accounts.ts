/**
 * Plan Comptable Général France — classes 1-7, comptes de base restauration.
 * Source normative : PCG 2014 (ANC règlement 2014-03).
 */

export interface PcgAccount {
  number: string;
  label: string;
  class: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  nature: 'bilan' | 'resultat';
}

export const PCG_ACCOUNTS: PcgAccount[] = [
  // Classe 1 — Comptes de capitaux
  { number: '101000', label: 'Capital social', class: 1, nature: 'bilan' },
  { number: '110000', label: 'Report à nouveau', class: 1, nature: 'bilan' },
  { number: '120000', label: 'Résultat de l\'exercice (bénéfice)', class: 1, nature: 'bilan' },
  { number: '129000', label: 'Résultat de l\'exercice (perte)', class: 1, nature: 'bilan' },
  { number: '164000', label: 'Emprunts auprès des établissements de crédit', class: 1, nature: 'bilan' },

  // Classe 2 — Comptes d'immobilisations
  { number: '213000', label: 'Constructions', class: 2, nature: 'bilan' },
  { number: '215000', label: 'Matériel et outillage', class: 2, nature: 'bilan' },
  { number: '218400', label: 'Mobilier et matériel de bureau', class: 2, nature: 'bilan' },
  { number: '281500', label: 'Amort. matériel et outillage', class: 2, nature: 'bilan' },

  // Classe 3 — Comptes de stocks
  { number: '310000', label: 'Matières premières (denrées)', class: 3, nature: 'bilan' },
  { number: '355000', label: 'Produits finis (plats préparés)', class: 3, nature: 'bilan' },
  { number: '371000', label: 'Marchandises (boissons revente)', class: 3, nature: 'bilan' },

  // Classe 4 — Comptes de tiers
  { number: '401000', label: 'Fournisseurs', class: 4, nature: 'bilan' },
  { number: '404000', label: 'Fournisseurs d\'immobilisations', class: 4, nature: 'bilan' },
  { number: '411000', label: 'Clients', class: 4, nature: 'bilan' },
  { number: '421000', label: 'Personnel — rémunérations dues', class: 4, nature: 'bilan' },
  { number: '431000', label: 'Sécurité sociale', class: 4, nature: 'bilan' },
  { number: '445710', label: 'TVA collectée (10%)', class: 4, nature: 'bilan' },
  { number: '445720', label: 'TVA collectée (20%)', class: 4, nature: 'bilan' },
  { number: '445660', label: 'TVA déductible sur autres biens', class: 4, nature: 'bilan' },
  { number: '447000', label: 'Autres impôts et taxes', class: 4, nature: 'bilan' },
  { number: '455000', label: 'Associés — comptes courants', class: 4, nature: 'bilan' },

  // Classe 5 — Comptes financiers
  { number: '512000', label: 'Banque', class: 5, nature: 'bilan' },
  { number: '514000', label: 'Chèques postaux', class: 5, nature: 'bilan' },
  { number: '530000', label: 'Caisse', class: 5, nature: 'bilan' },
  { number: '581000', label: 'Virements internes', class: 5, nature: 'bilan' },

  // Classe 6 — Comptes de charges
  { number: '601000', label: 'Achats de matières premières', class: 6, nature: 'resultat' },
  { number: '607000', label: 'Achats de marchandises', class: 6, nature: 'resultat' },
  { number: '613000', label: 'Locations', class: 6, nature: 'resultat' },
  { number: '615000', label: 'Entretien et réparations', class: 6, nature: 'resultat' },
  { number: '616000', label: 'Primes d\'assurance', class: 6, nature: 'resultat' },
  { number: '621000', label: 'Personnel extérieur (intérim)', class: 6, nature: 'resultat' },
  { number: '625000', label: 'Déplacements et réceptions', class: 6, nature: 'resultat' },
  { number: '626000', label: 'Frais postaux et télécom', class: 6, nature: 'resultat' },
  { number: '627000', label: 'Services bancaires', class: 6, nature: 'resultat' },
  { number: '631000', label: 'Impôts, taxes sur rémunérations', class: 6, nature: 'resultat' },
  { number: '641000', label: 'Rémunérations du personnel', class: 6, nature: 'resultat' },
  { number: '645000', label: 'Charges de sécurité sociale', class: 6, nature: 'resultat' },
  { number: '651000', label: 'Redevances pour concessions', class: 6, nature: 'resultat' },
  { number: '661000', label: 'Charges d\'intérêts', class: 6, nature: 'resultat' },
  { number: '671000', label: 'Charges exceptionnelles', class: 6, nature: 'resultat' },
  { number: '681000', label: 'Dotations aux amortissements', class: 6, nature: 'resultat' },

  // Classe 7 — Comptes de produits
  { number: '706000', label: 'Prestations de services (couverts)', class: 7, nature: 'resultat' },
  { number: '707000', label: 'Ventes de marchandises (boissons)', class: 7, nature: 'resultat' },
  { number: '708500', label: 'Pourboires collectés', class: 7, nature: 'resultat' },
  { number: '740000', label: 'Subventions d\'exploitation', class: 7, nature: 'resultat' },
  { number: '758000', label: 'Produits divers de gestion', class: 7, nature: 'resultat' },
  { number: '771000', label: 'Produits exceptionnels', class: 7, nature: 'resultat' },
];
