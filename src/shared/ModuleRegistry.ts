/**
 * 📛 MODULE REGISTRY — Grade IX (Registre des Naissances)
 * 
 * Source de vérité UNIQUE pour les modules autorisés.
 * Si un module n'est pas inscrit ici, il N'EXISTE PAS
 * pour le NexusSyncService, le GlobalRegistry et le GenomeValidator.
 * 
 * "Personne ne rentre dans le Bridge sans être sur la liste VIP."
 */

import type { ModuleId } from './genome.types';

/**
 * Les 35 modules souverains autorisés.
 * Toute tentative d'enregistrement d'un ID hors de cette liste
 * sera rejetée par le GlobalRegistryService.
 */
export const SOVEREIGN_MODULE_IDS: ReadonlySet<ModuleId> = new Set<ModuleId>([
  // Infrastructure
  'DASHBOARD', 'AI_INTEL', 'MAP_3D',
  // Opérations
  'POS', 'FLOOR_PLAN', 'KDS', 'RESERVATIONS', 'OMNI_RES',
  // Relation Client
  'CRM', 'QUOTES', 'GROUPS',
  // Production
  'KITCHEN', 'BAR', 'STORAGE_MAP',
  // Back-Office
  'INVENTORY', 'HACCP', 'RECEPTION',
  // RH
  'CLOCK_IN', 'HR', 'PLANNING', 'LEAVE', 'RECRUITMENT',
  // Intelligence
  'BI', 'GOOGLE_ANALYTICS', 'MARKETING', 'AI_REFERENCING', 'SEO',
  // Gouvernance
  'TREASURY', 'ACCOUNTING', 'REGISTERS',
  // Souveraineté
  'SETTINGS', 'ACCESS', 'FLEET', 'ANTIGRAVITY',
]);

/**
 * Type Guard : Vérifie qu'un string est un ModuleId autorisé.
 * Utilisé comme douane à l'entrée du système.
 */
export function isRegisteredModule(id: string): id is ModuleId {
  return SOVEREIGN_MODULE_IDS.has(id as ModuleId);
}

/**
 * Retourne le nombre total de modules enregistrés.
 * Doit toujours être 35 pour le Grade IX.
 */
export function getRegistrySize(): number {
  return SOVEREIGN_MODULE_IDS.size;
}
