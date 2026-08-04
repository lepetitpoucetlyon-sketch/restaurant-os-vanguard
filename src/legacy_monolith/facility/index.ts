/**
 * Pilier 8 — Facility
 * Espace physique, équipements, maintenance, assets.
 *
 * Domaines :
 * - spaces/    : Layout, zones, tables, plans d'étage, capacité
 * - assets/    : Cycle de vie équipements (TPE, imprimantes, fours, etc.)
 * - maintenance/ : Registres, interventions, contrats prestataires, GMAO
 */

export * from '@/verticals/restaurant/ops/table-management';
export * from '@/verticals/restaurant/compliance/maintenance';
export * from '@/shared/nexus/engines/AssetManager';

export type { FloorPlanEditorRef } from '@/verticals/restaurant/ops/table-management/floor-plan/FloorPlanEditor';
