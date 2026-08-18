import type { PlatformVariant } from '@/modules/system/domain/schemas/tenant';

export interface VerticalSupportContext {
  /** Nom du produit affiché dans le system prompt */
  productName: string;
  /** Description métier en 2 phrases pour le LLM */
  businessDescription: string;
  /** Vocabulaire clé : termes que le LLM doit utiliser (pas inventer) */
  keyTerms: string[];
  /** Modules phares à citer si actifs */
  featuredModules: string[];
}

export const VERTICAL_SUPPORT_CONTEXTS: Record<PlatformVariant, VerticalSupportContext> = {
  restaurant: {
    productName: 'Restaurant OS',
    businessDescription:
      'Logiciel tout-en-un de gestion de restaurant : encaissement NF525 (POS), ' +
      'affichage cuisine (KDS), réservations, stocks, comptabilité, HACCP, RH.',
    keyTerms: ['ticket', 'table', 'couvert', 'service', 'addition', 'caisse journée',
               'Z de caisse', 'fournée', 'plan de salle', 'module HACCP', 'NF525'],
    featuredModules: ['pos', 'kds', 'reservations', 'inventory', 'haccp', 'accounting'],
  },
  hotel: {
    productName: 'Hôtel OS',
    businessDescription:
      'Logiciel de gestion hôtelière : réception (Front Desk), gestion des chambres, ' +
      'check-in/check-out, housekeeping, facturation séjour, conciergerie.',
    keyTerms: ['check-in', 'check-out', 'chambre', 'séjour', 'réservation', 'folio',
               'housekeeping', 'service en chambre', 'tarif rack', 'channel manager'],
    featuredModules: ['frontdesk', 'rooms', 'reservations', 'billing', 'pos'],
  },
  bakery: {
    productName: 'Bakery OS',
    businessDescription:
      'Logiciel de gestion de boulangerie-pâtisserie : caisse, gestion de production ' +
      '(fournées), commandes fournisseurs, fidélité client, vitrine en ligne.',
    keyTerms: ['fournée', 'production', 'pâton', 'mise en fermentation', 'caisse',
               'commande fournisseur', 'carte fidélité', 'précommande', 'viennoiserie'],
    featuredModules: ['pos', 'production', 'inventory', 'loyalty', 'showcase'],
  },
  salon: {
    productName: 'Salon OS',
    businessDescription:
      'Logiciel de gestion de salon de coiffure et instituts de beauté : agenda, ' +
      'gestion techniciens, prestations, fidélité client, caisse.',
    keyTerms: ['rendez-vous', 'prestation', 'technicien', 'couleur', 'balayage',
               'agenda', 'créneau', 'client fidèle', 'bon cadeau', 'caisse'],
    featuredModules: ['agenda', 'pos', 'staff', 'loyalty', 'crm'],
  },
  clinic: {
    productName: 'Clinic OS',
    businessDescription:
      'Logiciel de gestion de cabinet médical ou paramédical : agenda consultations, ' +
      'dossier patient, feuille de soins, facturation CPAM, ordonnances.',
    keyTerms: ['consultation', 'patient', 'praticien', 'ordonnance', 'feuille de soins',
               'CPAM', 'téléconsultation', 'agenda médical', 'acte', 'cotation NGAP'],
    featuredModules: ['agenda', 'patients', 'billing', 'pos'],
  },
  garage: {
    productName: 'Garage OS',
    businessDescription:
      'Logiciel de gestion de garage automobile : bon de réparation (OR), ' +
      'planning atelier, facturation VGE, stock pièces détachées, gestion flotte client.',
    keyTerms: ['bon de réparation', 'ordre de réparation', 'OR', 'VGE', 'immatriculation',
               'main-d\'œuvre', 'pièce', 'devis', 'diagnostic OBD', 'planning atelier'],
    featuredModules: ['pos', 'repairs', 'inventory', 'fleet', 'billing'],
  },
  retail: {
    productName: 'Retail OS',
    businessDescription:
      'Logiciel de caisse et gestion de commerce de détail : caisse multi-écran, ' +
      'inventaire, étiquettes, fidélité, vitrine e-commerce.',
    keyTerms: ['caisse', 'article', 'référence', 'code-barres', 'inventaire',
               'rupture', 'étiquette prix', 'promotion', 'carte fidélité', 'vitrine'],
    featuredModules: ['pos', 'inventory', 'loyalty', 'showcase', 'analytics'],
  },
  custom: {
    productName: 'Business OS',
    businessDescription:
      'Plateforme de gestion multi-métier configurable : modules activables selon ' +
      'les besoins spécifiques du client.',
    keyTerms: ['module', 'configuration', 'caisse', 'stock', 'client', 'planning'],
    featuredModules: [],
  },
  gym: {
    productName: 'Gym OS',
    businessDescription:
      'Logiciel de gestion de salle de sport : abonnements membres, contrôle d\'accès, ' +
      'planning cours collectifs, coaching, boutique nutrition et suivi assiduité.',
    keyTerms: ['abonnement', 'membre', 'badge', 'cours', 'coach', 'planning', 'contrôle d\'accès',
               'nutrition', 'assiduité', 'séance', 'salle', 'SEPA'],
    featuredModules: ['pos', 'reservations', 'customer', 'hr', 'planning', 'inventory'],
  },
  coworking: {
    productName: 'Coworking OS',
    businessDescription:
      'Logiciel de gestion d\'espace de coworking : réservation bureaux et salles de réunion, ' +
      'pass journaliers, facturation récurrente, contrôle d\'accès et communauté.',
    keyTerms: ['bureau', 'salle de réunion', 'pass', 'poste de travail', 'abonnement',
               'facturation mensuelle', 'contrôle d\'accès', 'communauté', 'événement', 'wifi'],
    featuredModules: ['reservations', 'pos', 'floor_plan', 'customer', 'billing'],
  },
  veterinary: {
    productName: 'Veterinary OS',
    businessDescription:
      'Logiciel de gestion de clinique vétérinaire : dossiers animaux, rendez-vous, ' +
      'vaccins, actes chirurgicaux, pharmacie vétérinaire et facturation.',
    keyTerms: ['patient', 'animal', 'consultation', 'vaccin', 'ordonnance', 'acte',
               'pharmacie vétérinaire', 'dossier médical', 'rappel vaccin', 'chirurgie', 'ASV'],
    featuredModules: ['reservations', 'customer', 'pos', 'inventory', 'hr'],
  },
  florist: {
    productName: 'Florist OS',
    businessDescription:
      'Logiciel de gestion de fleuristerie : caisse au comptoir, commandes évènement, ' +
      'gestion périssables, chambre froide, livraisons et bouquets sur mesure.',
    keyTerms: ['bouquet', 'composition', 'mariage', 'deuil', 'événement', 'livraison',
               'chambre froide', 'fleur coupée', 'commande', 'périssable', 'saison'],
    featuredModules: ['pos', 'reservations', 'inventory', 'customer', 'quotes'],
  },
};
