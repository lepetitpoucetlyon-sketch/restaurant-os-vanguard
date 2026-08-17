/**
 * 🏛️ VerticalBlueprintRegistry — Registre centralisé des Blueprints Métiers Nexus
 *
 * Source unique de vérité pour toutes les verticales actuelles (Restaurant, Salon, Bakery, Hotel,
 * Garage, Clinic, Retail, Custom) et futures (Gym, Coworking, Veterinary, Florist...).
 *
 * Fournit :
 *  - La liste de tous les blueprints homologués
 *  - La résolution par slug ou sous-variante
 *  - La validation Zod & conformité Grade X
 */

import type { VerticalBlueprint } from '../blueprint/VerticalBlueprint';
import { RESTAURANT_BLUEPRINT } from '../../restaurant/restaurant.blueprint';
import { SALON_BLUEPRINT } from '../../salon/salon.blueprint';
import { BAKERY_BLUEPRINT } from '../../bakery/bakery.blueprint';
import { HOTEL_BLUEPRINT } from '../../hotel/hotel.blueprint';
import { GARAGE_BLUEPRINT } from '../../garage/garage.blueprint';
import { CLINIC_BLUEPRINT } from '../../clinic/clinic.blueprint';
import { RETAIL_BLUEPRINT } from '../../retail/retail.blueprint';
import { CUSTOM_BLUEPRINT } from '../../custom/custom.blueprint';
import { GYM_BLUEPRINT } from '../../gym/gym.blueprint';
import { COWORKING_BLUEPRINT } from '../../coworking/coworking.blueprint';
import { VETERINARY_BLUEPRINT } from '../../veterinary/veterinary.blueprint';
import { FLORIST_BLUEPRINT } from '../../florist/florist.blueprint';

/**
 * Catalogue complet de tous les Blueprints (Actuels + Futurs)
 */
export const VERTICAL_BLUEPRINTS: Record<string, VerticalBlueprint> = {
  // --- 🏛️ Verticales Actuelles Déployées ---
  restaurant: RESTAURANT_BLUEPRINT,
  salon: SALON_BLUEPRINT,
  bakery: BAKERY_BLUEPRINT,
  hotel: HOTEL_BLUEPRINT,
  garage: GARAGE_BLUEPRINT,
  clinic: CLINIC_BLUEPRINT,
  retail: RETAIL_BLUEPRINT,
  custom: CUSTOM_BLUEPRINT,

  // --- 🚀 Futures Verticales Homologuées (Expansion) ---
  gym: GYM_BLUEPRINT,
  coworking: COWORKING_BLUEPRINT,
  veterinary: VETERINARY_BLUEPRINT,
  florist: FLORIST_BLUEPRINT,
};

/**
 * Récupère le blueprint d'une verticale par son slug.
 */
export function getVerticalBlueprint(slug: string): VerticalBlueprint | undefined {
  return VERTICAL_BLUEPRINTS[slug];
}

/**
 * Liste tous les slugs des blueprints disponibles.
 */
export function getAllBlueprintSlugs(): string[] {
  return Object.keys(VERTICAL_BLUEPRINTS);
}

/**
 * Vérifie si un slug correspond à une verticale active ou future déclarée.
 */
export function hasVerticalBlueprint(slug: string): boolean {
  return slug in VERTICAL_BLUEPRINTS;
}
