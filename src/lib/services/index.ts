/**
 * 🔧 LIB/SERVICES — Services métier transversaux
 *
 * Barrel logique pour la couche services de lib/.
 * Les fichiers sources restent à la racine de lib/ pour compatibilité ascendante
 * et seront physiquement déplacés ici lors d'un sprint dédié post-versionbase.
 *
 * Import conseillé : `import { X } from '@/lib/<ServiceName>'`
 * Import futur     : `import { X } from '@/lib/services'`
 *
 * Périmètre :
 *   AccessPolicyManager, ArchitecturalHealthService, BackupProvider,
 *   BrandingProvider, BrandingService, BrandingUI,
 *   CommunicationService, CryptoService, DemoSeeder,
 *   EdgeSyncService, GenomeValidator, GlobalRegistryService,
 *   GreenEngine, GroupService, IDService, IdentityGuardService,
 *   IdentityManager, MaintenanceAgent, MigrationService,
 *   MosyleClient, NexusSyncService, NexusTelemetryService,
 *   OfflineMasteryEngine, ProvisioningEngine, QuantumCrypto,
 *   RoleTemplates, RuntimeValidator, SecurityGuard,
 *   SettingsManager, Slayer, Storage, TenantSeeder,
 *   TimeSync, ZKBenchmarkEngine, ZodInterceptor
 */

// Re-exports activés au fur et à mesure des migrations physiques.
// Ligne par ligne : décommenter quand le fichier est déplacé ici.

export * from '../AccessPolicyManager';
export * from '../ArchitecturalHealthService';
export * from '../BackupProvider';
export { BrandingProvider } from '../BrandingProvider';
export * from '../BrandingUI';
export * from '../CommunicationService';
export * from '../CryptoService';
export * from '../EdgeSyncService';
export * from '../GenomeValidator';
export * from '../GlobalRegistryService';
export * from '../GroupService';
export * from '../IDService';
export * from '../IdentityManager';
export * from '../MigrationService';
export * from '../NexusSyncService';
export * from '../NexusTelemetryService';
export * from '../OfflineMasteryEngine';
export * from '../ProvisioningEngine';
export * from '../QuantumCrypto';
export * from '../RoleTemplates';
export * from '../RuntimeValidator';
export * from '../SecurityGuard';
export * from '../SettingsManager';
export * from '../Storage';
export * from '../TenantSeeder';
export * from '../TimeSync';
export * from '../ZodInterceptor';
