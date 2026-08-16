/**
 * Pilier 8 — Facility
 * Espace physique, équipements, maintenance, assets.
 *
 * Domaines :
 * - spaces/    : Layout, zones, tables, plans d'étage, capacité
 * - assets/    : Cycle de vie équipements, factures, garanties
 * - maintenance/ : Registres, interventions, contrats prestataires, GMAO
 * - components/ : Vues et widgets UI (EquipmentHubView, Onboarding, Modales)
 */

export * from './spaces';
export * from './maintenance';
export * from './assets';
export * from './components';
export { EquipmentAssetService } from './services/EquipmentAssetService';
export { EquipmentKnowledgeService, DEFAULT_EQUIPMENT_GUIDE_TEMPLATES } from './services/EquipmentKnowledgeService';
export { EquipmentDiagnosticService, FAULT_DIAGNOSTIC_DATABASE } from './services/EquipmentDiagnosticService';
export { HardwareProvisioningService } from './services/HardwareProvisioningService';

export type { FloorPlanEditorRef } from './spaces/floor-plan/FloorPlanEditor';
