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
export * from '@/shared/nexus/engines/Compliance/PolicyEngine';
export * from '@/verticals/restaurant/compliance/haccp/services/PlanMaitriseSanitaire';
export * from '@modules/compliance/services/QualityEngine';
export * from '@/verticals/restaurant/compliance/haccp/services/HACCPTelemetryBridge';
export * from '@modules/compliance/services/LegalArchiveService';
export * from '@modules/logistics/services/ProcurementService';
export * from '@modules/logistics/services/StockEngine';
export * from '@modules/logistics/services/InventoryVisionService';
export * from '@modules/logistics/services/InvoiceExtractionService';
export * from '@/verticals/restaurant/ops/kitchen/services/KitchenService';
export * from '@/verticals/restaurant/ops/pos/services/ReservationService';
export * from '@/verticals/restaurant/commerce/acquisition/marketing/services/MarketingService';
export * from '@modules/intelligence/services/MacroBrain';
export * from '@modules/intelligence/services/OracleEngine';
export * from '@modules/intelligence/services/VisionService';
export * from '@modules/intelligence/services/VisualIdentityExtractor';
export * from '@modules/intelligence/services/VoiceCommandService';
export * from '@modules/intelligence/services/DataDigester';

// Rapatriés — intelligence/fleet
export * from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetCommander';
export * from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetComplianceService';
export * from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetTelemetryExecutor';
export * from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetTelemetryService';
export * from '@/shared/nexus/engines/Intelligence/ia/fleet/QuantumOrchestrator';

// Rapatriés — intelligence/simulator
export * from '@/shared/nexus/engines/Intelligence/ia/simulator/SimulationService';

// Rapatriés — intelligence/resilience
export * from '@/shared/nexus/engines/Intelligence/ia/resilience/ResilienceSlayer';
export * from '@/shared/nexus/engines/Intelligence/ia/resilience/ChaosMonkey';

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
