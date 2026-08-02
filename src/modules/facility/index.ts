/**
 * Pilier 8 — Facility
 * Espace physique, équipements, maintenance, assets.
 *
 * Domaines :
 * - spaces/    : Layout, zones, tables, plans d'étage, capacité
 * - assets/    : Cycle de vie équipements (TPE, imprimantes, fours, etc.)
 * - maintenance/ : Registres, interventions, contrats prestataires, GMAO
 */

export * from './spaces';
export * from './maintenance';
export * from './assets';

export type { FloorPlanEditorRef } from './spaces/floor-plan/FloorPlanEditor';
