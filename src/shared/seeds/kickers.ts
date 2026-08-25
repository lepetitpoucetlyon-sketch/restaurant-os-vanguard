/**
 * 🎨 KICKERS_BY_VARIANT — vocabulaire éditorial du kicker Playfair italic
 *   uppercase que porte chaque header `PageShell.EditorialTitle` selon la
 *   verticale active et le domaine universel de la page.
 *
 * Le kicker est le mot 3 lettres → 12 lettres qui précède le big-title d'une
 * page opérationnelle (`Table 12`, `Cuisine 12:45`, `Chambre 204`…). C'est
 * l'ancrage sémantique du contenu ; il n'a de sens qu'au regard du secteur.
 *
 * Deux consommateurs :
 *  1. Le forge (`renderVerticalHeader`) : pioche `KICKERS_BY_VARIANT[variant][domain]`
 *     pour scaffolder un tsx aligné dès la première ligne — plus d'invention.
 *  2. L'IA de composition : quand elle propose un nouvel écran opérationnel,
 *     elle regarde ici pour ne pas inventer un mot hors registre.
 *
 * Convention :
 *  - Chaque variant expose une clé pour CHACUN des 8 piliers universels
 *    (finance, human, commerce, ops, logistics, intelligence, compliance,
 *    facility) — et pour les domaines emblématiques (kitchen, spaces…).
 *  - Un kicker inconnu retombe sur `custom` puis sur `restaurant` (défaut
 *    historique) — voir `resolveKicker()` plus bas.
 */

import type { PlatformVariant } from '@/modules/system';

/** Domaines universels + emblématiques (union libre — ajouter à la demande). */
export type KickerDomain =
    // Piliers universels
    | 'finance'
    | 'human'
    | 'commerce'
    | 'ops'
    | 'logistics'
    | 'intelligence'
    | 'compliance'
    | 'facility'
    // Domaines emblématiques restaurant/hôtellerie
    | 'kitchen'
    | 'spaces'
    | 'service'
    // Domaines emblématiques santé / vétérinaire / clinique
    | 'medical'
    // Domaines emblématiques retail / e-commerce / boutique
    | 'catalog';

type KickerMap = Partial<Record<KickerDomain, string>>;

/** Kicker map par verticale (tous les mots sont français, en majuscules attendues). */
export const KICKERS_BY_VARIANT: Record<PlatformVariant, KickerMap> = {
    restaurant: {
        finance: 'Trésorerie',
        human: 'Effectifs',
        commerce: 'Salle',
        ops: 'Service',
        logistics: 'Approvisionnement',
        intelligence: 'Pilotage',
        compliance: 'HACCP',
        facility: 'Plan',
        kitchen: 'Cuisine',
        spaces: 'Plan',
        service: 'Table',
    },
    hotel: {
        finance: 'Comptabilité',
        human: 'Équipe',
        commerce: 'Réception',
        ops: 'Séjour',
        logistics: 'Stocks',
        intelligence: 'Pilotage',
        compliance: 'Sécurité',
        facility: 'Étage',
        kitchen: 'Restauration',
        spaces: 'Chambre',
        service: 'Chambre',
    },
    bakery: {
        finance: 'Caisse',
        human: 'Équipe',
        commerce: 'Boutique',
        ops: 'Fournée',
        logistics: 'Matières',
        intelligence: 'Ventes',
        compliance: 'HACCP',
        facility: 'Atelier',
        kitchen: 'Laboratoire',
        spaces: 'Boutique',
    },
    garage: {
        finance: 'Facturation',
        human: 'Compagnons',
        commerce: 'Accueil',
        ops: 'Atelier',
        logistics: 'Pièces',
        intelligence: 'Rentabilité',
        compliance: 'Contrôle',
        facility: 'Baie',
        spaces: 'Baie',
    },
    salon: {
        finance: 'Encaissement',
        human: 'Équipe',
        commerce: 'Clients',
        ops: 'Prestations',
        logistics: 'Produits',
        intelligence: 'Pilotage',
        compliance: 'Hygiène',
        facility: 'Poste',
        spaces: 'Poste',
    },
    clinic: {
        finance: 'Facturation',
        human: 'Praticiens',
        commerce: 'Patients',
        ops: 'Consultations',
        logistics: 'Fournitures',
        intelligence: 'Pilotage',
        compliance: 'Traçabilité',
        facility: 'Salle',
        medical: 'Consultation',
        spaces: 'Salle',
    },
    retail: {
        finance: 'Caisse',
        human: 'Équipe',
        commerce: 'Boutique',
        ops: 'Ventes',
        logistics: 'Stock',
        intelligence: 'Performance',
        compliance: 'Contrôle',
        facility: 'Rayon',
        catalog: 'Catalogue',
        spaces: 'Rayon',
    },
    gym: {
        finance: 'Cotisations',
        human: 'Coachs',
        commerce: 'Adhérents',
        ops: 'Cours',
        logistics: 'Équipement',
        intelligence: 'Assiduité',
        compliance: 'Sécurité',
        facility: 'Plateau',
        spaces: 'Plateau',
    },
    coworking: {
        finance: 'Facturation',
        human: 'Équipe',
        commerce: 'Membres',
        ops: 'Réservations',
        logistics: 'Consommables',
        intelligence: 'Occupation',
        compliance: 'Sécurité',
        facility: 'Bureau',
        spaces: 'Bureau',
    },
    veterinary: {
        finance: 'Facturation',
        human: 'Praticiens',
        commerce: 'Patients',
        ops: 'Consultations',
        logistics: 'Pharmacie',
        intelligence: 'Suivi',
        compliance: 'Traçabilité',
        facility: 'Box',
        medical: 'Consultation',
        spaces: 'Box',
    },
    florist: {
        finance: 'Caisse',
        human: 'Équipe',
        commerce: 'Commandes',
        ops: 'Ateliers',
        logistics: 'Approvisionnement',
        intelligence: 'Ventes',
        compliance: 'Fraîcheur',
        facility: 'Boutique',
        spaces: 'Boutique',
    },
    custom: {
        finance: 'Finance',
        human: 'Équipe',
        commerce: 'Clients',
        ops: 'Opérations',
        logistics: 'Stock',
        intelligence: 'Pilotage',
        compliance: 'Conformité',
        facility: 'Espace',
    },
};

/**
 * Résout le kicker pour un couple (variant, domain) avec fallback sûr :
 * variant demandé → `custom` → `restaurant` (défaut historique) → domain
 * brut capitalisé si vraiment rien.
 */
export function resolveKicker(variant: PlatformVariant, domain: KickerDomain): string {
    const primary = KICKERS_BY_VARIANT[variant]?.[domain];
    if (primary) return primary;
    const generic = KICKERS_BY_VARIANT.custom?.[domain];
    if (generic) return generic;
    const restaurantFallback = KICKERS_BY_VARIANT.restaurant?.[domain];
    if (restaurantFallback) return restaurantFallback;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
}

/** Liste tous les domaines déclarés pour un variant (utile en preview forge). */
export function listKickerDomains(variant: PlatformVariant): KickerDomain[] {
    return Object.keys(KICKERS_BY_VARIANT[variant] ?? {}) as KickerDomain[];
}
