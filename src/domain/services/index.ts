// Rapatriés dans leurs piliers — re-exports de compatibilité temporaire
export * from '@modules/human/services/HumanResources';
export * from '@modules/human/services/NexusPayrollEngine';
export * from '@modules/human/services/NexusStaffingOracle';
export * from '@modules/human/services/StaffService';
export * from '@modules/finance/services/NexusYieldEngine';
export * from '@modules/finance/services/SplitBillDomainService';
export * from '@modules/finance/services/QuoteEngine';
export * from '@modules/finance/services/TreasuryCalculator';
export * from '@modules/finance/services/TreasuryEngine';
export * from '@modules/finance/services/TransactionService';
export * from '@/modules/compliance/securite/PolicyEngine';
export * from '@/modules/compliance/qualite/haccp/services/PlanMaitriseSanitaire';
export * from '@modules/compliance/services/QualityEngine';
export * from '@/modules/compliance/qualite/haccp/services/HACCPTelemetryBridge';
export * from '@modules/compliance/services/LegalArchiveService';
export * from '@modules/logistics/services/ProcurementService';
export * from '@modules/logistics/services/StockEngine';
export * from '@modules/logistics/services/InventoryVisionService';
export * from '@modules/logistics/services/InvoiceExtractionService';
export * from '@/modules/ops/production/kitchen/services/KitchenService';
export * from '@/modules/ops/service/pos/services/ReservationService';
export * from '@/modules/commerce/acquisition/marketing/services/MarketingService';
export * from '@modules/intelligence/services/MacroBrain';
export * from '@modules/intelligence/services/OracleEngine';
export * from '@modules/intelligence/services/VisionService';
export * from '@modules/intelligence/services/VisualIdentityExtractor';
export * from '@modules/intelligence/services/VoiceCommandService';
export * from '@modules/intelligence/services/DataDigester';

// Rapatriés — intelligence/fleet
export * from '@/modules/intelligence/ia/fleet/FleetCommander';
export * from '@/modules/intelligence/ia/fleet/FleetComplianceService';
export * from '@/modules/intelligence/ia/fleet/FleetTelemetryExecutor';
export * from '@/modules/intelligence/ia/fleet/FleetTelemetryService';
export * from '@/modules/intelligence/ia/fleet/QuantumOrchestrator';

// Rapatriés — intelligence/simulator
export * from '@/modules/intelligence/ia/simulator/SimulationService';

// Rapatriés — intelligence/resilience
export * from '@/modules/intelligence/ia/resilience/ResilienceSlayer';
export * from '@/modules/intelligence/ia/resilience/ChaosMonkey';

// Restent dans domain/services (partagés cross-piliers)
export * from './AccessPolicyManager';
export * from './AmbianceService';
export * from './BrandingService';
export * from './BrandingUI';
export * from './CryptoService';
export * from './EdgeSyncService';
export * from './GenomeValidator';
export * from './GreenEngine';
export * from './GroupService';
export * from './IdentityGuardService';
export * from './IdentityManager';
export * from './MaintenanceAgent';
export * from './NexusTelemetryService';
export * from './OfflineMasteryEngine';
export * from './ProvisioningEngine';
export * from './SettingsManager';
export * from './Slayer';
export * from './Storage';
export * from './TenantSeeder';
export * from './ZKBenchmarkEngine';
export * from './ZodInterceptor';
export * from './SecurityGuard';
export * from './RoleTemplates';
