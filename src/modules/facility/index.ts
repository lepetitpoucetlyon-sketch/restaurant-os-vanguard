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

// Hooks souverains (ADR-013 Phase 5)
export * from './hooks';

export * from './spaces';
export * from './spaces/settings';
export * from './spaces/settings/store/settingsAtoms';
export * from './assets';
export { EquipmentAssetService } from './services/EquipmentAssetService';
export { EquipmentKnowledgeService, DEFAULT_EQUIPMENT_GUIDE_TEMPLATES } from './services/EquipmentKnowledgeService';
export { EquipmentDiagnosticService, FAULT_DIAGNOSTIC_DATABASE } from './services/EquipmentDiagnosticService';
export {
  HardwareProvisioningService,
  HARDWARE_CHECKLIST_SPECS,
  type HardwareCommissioningReport,
  type HardwareCheckItemResult,
} from './services/HardwareProvisioningService';
export { MaintenanceAlertConfigService } from './services/MaintenanceAlertConfigService';
export { DeviceFleetManager, type DeviceRecord, type DeviceType, type DeviceStatus } from './services/DeviceFleetManager';
export { AmbianceService, type RestaurantAmbiance } from './spaces/AmbianceService';

export { EquipmentHubView } from './components/equipment/EquipmentHubView';
// FloorPlanEditor n'est PAS exporte en valeur : il tire konva + react-konva (~400 Ko)
// dans tout consommateur de @/modules/facility. A charger via next/dynamic :
//   dynamic(() => import('@/modules/facility/spaces/floor-plan/FloorPlanEditor').then(m => m.FloorPlanEditor), { ssr: false })
export type { FloorPlanEditorRef } from './spaces/floor-plan/FloorPlanEditor';
export { FloorPlanHeader } from './spaces/components/FloorPlanHeader';
export {
  DUERPSection,
  IncendieSection,
  Cerfa13984Section,
  PrestatairesSection,
  PMRSection,
  SanitaryComplianceSection,
  InterventionLogSection,
} from './maintenance/registre';

export type { TableStatus } from './spaces/types';
export { assertTableTransition, isTableTransitionAllowed, getAllowedTransitions, TableTransitionError, TABLE_LIFECYCLE_TRANSITIONS } from '@/shared/domain/tableLifecycle';
export { MaintenanceAgent } from './services/MaintenanceAgent';
