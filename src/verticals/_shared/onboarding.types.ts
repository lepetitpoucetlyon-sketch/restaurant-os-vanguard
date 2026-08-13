/**
 * §8.6 Vague 5 — Contrats des profils d'onboarding par verticale.
 *
 * Chaque verticale déclare ses zones de plan (pour le wizard d'onboarding)
 * et ses SI concurrents depuis lesquels migrer. Le moteur d'onboarding
 * résout ces données à runtime via resolveFloorPlanProfiles / resolveSourceSystems.
 */

/** Zone pré-définie pour le wizard plan de salle */
export interface FloorPlanZone {
  /** Nom affiché dans l'UI */
  name: string;
  /** Nombre de tables/postes suggéré par défaut */
  defaultCount?: number;
}

/** Profil complet d'une verticale pour l'onboarding plan de salle */
export interface FloorPlanProfile {
  /** Libellé du concept de « place » dans cette verticale */
  spaceName: string;
  /** Zones disponibles par défaut */
  zones: readonly FloorPlanZone[];
}

/** SI concurrent depuis lequel importer les données */
export interface SourceSystem {
  /** Identifiant technique (correspond à ConnectorId si disponible) */
  id: string;
  /** Nom affiché */
  name: string;
  /** Catégories importables */
  categories: string[];
}
