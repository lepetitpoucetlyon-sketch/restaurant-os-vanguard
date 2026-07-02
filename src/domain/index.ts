/**
 * 🏛️ DOMAIN BARREL - Grade X (Manual Override)
 * Re-exports with explicit disambiguation for colliding symbols.
 * TaxBreakdown is exported by both ./finance/tax/types.ts and ./services/FinanceCore.ts
 * FECGenerator is exported by ./finance/fec/FECGenerator.ts
 * The canonical source for TaxBreakdown is ./finance/tax (domain layer).
 * The canonical source for FECGenerator is ./finance/fec (domain layer).
 */

export * from './agency';
export * from './agent';
export * from './agents';
export * from './constants';
export * from './finance';
export * from './procurement';
export * from './repositories';
export * from './shared';
export * from './system';
export * from './types';

// services: wildcard excluded to avoid TaxBreakdown collision with ./finance
// Consumers should import services directly from '@/domain/services/ServiceName'
// or we re-export everything EXCEPT the colliding symbol:
export {
    AccessPolicyManager,
} from './services/AccessPolicyManager';
export * from './services/AmbianceService';
export * from './services/BillingService';
export * from './services/BrandingService';
export * from './services/BrandingUI';
export * from './services/ChaosMonkey';
export * from './services/CryptoService';
export * from './services/DataDigester';
export * from './services/EdgeSyncService';
// FinanceCore excluded: TaxBreakdown collides with ./finance/tax/types — import from '@/domain/services/FinanceCore' directly
export * from './services/FiscalEngine';
export * from './services/FleetCommander';
export * from './services/FleetComplianceService';
export * from './services/FleetTelemetryExecutor';
export * from './services/FleetTelemetryService';
export * from './services/GenomeValidator';
export * from './services/GreenEngine';
export * from './services/GroupService';
export * from './services/HACCPTelemetryBridge';
export * from './services/HumanResources';
export * from './services/IdentityGuardService';
export * from './services/IdentityManager';
export * from './services/InventoryVisionService';
export * from './services/InvoiceExtractionService';
export * from './services/KitchenService';
export * from './services/LegalArchiveService';
export * from './services/MacroBrain';
export * from './services/MaintenanceAgent';
export * from './services/MarketingService';
export * from './services/NF525Service';
export * from './services/NexusPayrollEngine';
export * from './services/NexusStaffingOracle';
export * from './services/NexusTelemetryService';
export * from './services/NexusYieldEngine';
export * from './services/OfflineMasteryEngine';
export * from './services/OracleEngine';
export * from './services/ProcurementService';
export * from './services/ProvisioningEngine';
export * from './services/QualityEngine';
export * from './services/QuantumOrchestrator';
export * from './services/QuoteEngine';
export * from './services/ReservationService';
export * from './services/ResilienceSlayer';
export * from './services/SettingsManager';
export * from './services/SimulationService';
export * from './services/Slayer';
export * from './services/SovereignLedger';
export * from './services/SplitBillDomainService';
export * from './services/StaffService';
export * from './services/StockEngine';
export * from './services/Storage';
export * from './services/TenantSeeder';
export * from './services/TransactionService';
export * from './services/TreasuryEngine';
export * from './services/VisionService';
export * from './services/VisualIdentityExtractor';
export * from './services/VoiceCommandService';
export * from './services/ZKBenchmarkEngine';
export * from './services/ZodInterceptor';
