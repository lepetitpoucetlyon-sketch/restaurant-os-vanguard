import fs from 'fs';
import path from 'path';

const root = '/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE';
const contractsBase = path.join(root, 'src/shared/nexus/contracts');

// ==========================================
// 1. CREATE ALL GRANULAR CONTRACT TYPE FILES
// ==========================================

// 1.1 sovereign.types.ts
fs.writeFileSync(path.join(contractsBase, 'sovereign.types.ts'), `/**
 * 🏛️ SOVEREIGN TYPES — Universal SaaS Core Types
 * Extracted from nexus-contract.ts for Grade X modular alignment.
 */

export type SovereignField =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | unknown[]
  | { [key: string]: unknown }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'date'; value: Date | string }
  | { type: 'object'; value: Record<string, unknown> }
  | { type: 'array'; value: unknown[] };

export type SovereignValue = SovereignField;

export interface SovereignMap {
  [key: string]: SovereignField;
}

export type SovereignData<T = SovereignMap> = T;

export interface SovereignSchemaField {
  id: string;
  type?: string;
  unit?: string;
  subFields?: SovereignSchemaField[];
  [key: string]: SovereignField;
}

/**
 * 🏛️ SovereignNode - Universal Entity Contract
 * Any business object MUST implement this to be handled by the Core.
 */
export interface SovereignNode {
  id: string;
  updatedAt: string | Date | number;
  createdAt?: string | Date | number;
  [key: string]: SovereignField;
}
`, 'utf8');

// 1.2 identity.types.ts
fs.writeFileSync(path.join(contractsBase, 'identity.types.ts'), `/**
 * 🏛️ OperationalIdentity — Abstract Domain Identifiers
 */
export enum OperationalIdentity {
  CORE = "STX_CORE",
  FINANCE = "STX_FINANCE",
  OPS = "STX_OPS",
  HR = "STX_HR",
  CRM = "STX_CRM",
  LOGISTICS = "STX_LOGISTICS",
  INTELLIGENCE = "STX_INTELLIGENCE",
  NODES = "STX_ALPHA",
  ALLOCATIONS = "STX_BETA",
  FLOWS = "STX_GAMMA",
  RESOURCES = "STX_DELTA",
  PROTOCOLS = "STX_EPSILON",
  COMPLIANCE = "STX_ZETA",
  RELATIONS = "STX_ETA",
  STRUCTURES = "STX_THETA",
  ZONES = "STX_IOTA",
  STAFF = "STX_KAPPA",
  LEDGER = "STX_LAMBDA"
}
`, 'utf8');

// 1.3 nf525.types.ts
fs.writeFileSync(path.join(contractsBase, 'nf525.types.ts'), `import type { SovereignMap, SovereignData } from './sovereign.types';

export interface SovereignWriteSignature extends SovereignMap {
  scope: 'NF525_WRITE';
  version: 'NF525_WRITE_V1';
  tenantId: string;
  path: string;
  signedAt: string;
  payloadHash: string;
  signature: string;
}

export type SignedSovereignData = SovereignData & {
  __nf525?: SovereignWriteSignature;
};
`, 'utf8');

// 1.4 settings/business-laws.ts
const settingsDir = path.join(contractsBase, 'settings');
if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true });

fs.writeFileSync(path.join(settingsDir, 'business-laws.ts'), `import type { TenantConfig } from '@/modules/system/domain/schemas/tenant';

export interface BusinessLaws {
  node_capacity: number;
  fiscal_coefficient: number;
  currency: string;
  pmsEnabled: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface ExpertConfig {
  role: string;
  modelId: string;
  isConfigured: boolean;
  isAuthorized: boolean;
}

export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, 'id'> = {
  variant: 'restaurant',
  capabilities: {},
  features: {
    pos: true,
    kds: true,
    inventory: true,
    hr: true,
    reservations: true,
    finance: true,
    marketing: true
  },
  theme: {
    primaryColor: '#0F172A',
    secondaryColor: '#38BDF8',
    logoUrl: '',
    borderRadius: '12px',
    appearance: 'dark'
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    layoutType: 'default',
    licenceStatus: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    economy: {
      basePrice: 49.00,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
      discountMultiplier: 1
    },
    businessLaws: {
      node_capacity: 0,
      fiscal_coefficient: 0.1,
      currency: 'EUR',
      pmsEnabled: false
    },
    expert: {
      role: 'disabled',
      modelId: 'none',
      isConfigured: false,
      isAuthorized: false
    }
  },
  metadata: {
    name: 'Nexus Node',
    version: '1.0.0'
  }
};
`, 'utf8');

// 1.5 infrastructure/telemetry.types.ts
const infraDir = path.join(contractsBase, 'infrastructure');
if (!fs.existsSync(infraDir)) fs.mkdirSync(infraDir, { recursive: true });

fs.writeFileSync(path.join(infraDir, 'telemetry.types.ts'), `import type { NexusTimestamp } from './storage.contracts';

export interface TelemetryPulse {
  version: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL';
  lastPulse: NexusTimestamp | string | Date | number;
  health: {
    uptime: number;
    battery: {
      level: number;
      charging: boolean;
      supported: boolean;
    };
    network: {
      online: boolean;
      effectiveType: string;
    };
  };
  security: {
    nf525Sealed: boolean;
    integrityGrade: string;
    lastSealHash?: string;
  };
}
`, 'utf8');

// 1.6 infrastructure/firebase.types.ts
fs.writeFileSync(path.join(infraDir, 'firebase.types.ts'), `export interface TenantFirebaseConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  [key: string]: string | undefined;
}
`, 'utf8');

// ==========================================
// 2. UPDATE CONTRACTS HUB & LEGACY PROXY
// ==========================================

const contractsIndex = path.join(contractsBase, 'index.ts');
fs.writeFileSync(contractsIndex, `/**
 * 🏛️ NEXUS SHARED CONTRACTS - Universal SaaS Registry
 * Version Grade X - Sovereign Alignment
 */

// --- 🏛️ SOVEREIGN PRIMITIVES & GENOME ---
export * from "./sovereign.types";
export * from "./identity.types";
export * from "./nf525.types";
export * from "./settings/business-laws";
export * from "./infrastructure/telemetry.types";
export * from "./infrastructure/firebase.types";
export * from "../../genome.types";

// --- 🏛️ DOMAIN AUTHORITIES ---

// 1. Identity & Access
export type { 
    User, 
    UserRole, 
    UserStatus, 
    CategoryKey, 
    RolePermissions,
    AuthCredentials,
    AuthResponse
} from "./auth.types";

// 2. Physical Models (Neutral Ground)
export type {
    Table,
    Order,
    Reservation,
    OrderItem,
    OrderItemModification,
    TableStatus,
    OrderStatus,
    GroupEventStatus,
    TableShape
} from "./ops.types";

export type {
    Product,
    Recipe,
    Customer,
    ModuleId,
    RecipeIngredient,
    Floor,
    Zone,
    Quote,
    Order as LegacyOrder
} from "./nexus-internal-mapper";

export { NexusInternalMapper, canAccessModule } from "./nexus-internal-mapper";

// 3. Specialized Domains
export * from "./fleet.types";
export * from "./finance.types";
export * from "./hr.types";
export * from "./logistics";
export * from "./oracle.types";
export * from "./customer.types";
export * from "./settings";
export * from "./ops.types";
export * from "./recruitment";
export * from "./registre.types";
export * from "./compliance.types";
export * from "./commerce.types";
export * from "./permissions.types";
export * from "./franchise.types";

// 4. Operations Bridge (POS & Groups)
export type { CartItem } from "@/modules/ops/domain/schemas/pos";
export type { GroupEvent } from "./ops.types";

// --- 🛠️ UTILITIES & UI (Selective Export) ---
export type { 
    Notification, 
    NotificationType, 
    Option, 
    OptionGroup, 
    ProductIngredient,
    RecipeStep,
    SEOProfile,
    IntelligenceConfig,
    RecipeContextType,
    Category,
    WasteLog,
    PrepTask,
    MiseEnPlaceTask,
    MenuAnalysis,
    AuditLog,
    SentimentType,
    SocialReview,
    EquipmentMetric,
    PredictiveAlert,
    IngredientPricePoint,
    ProfitabilityAlert,
    SimulationScenario,
    DocCategory
} from "./common.types";

// --- 🌿 HYGIENE & COMPLIANCE (HACCP) ---
export * from "./settings/haccp";
export type {
    CleaningTask,
    ZoneConfig,
    EquipmentConfig,
    HygieneLog,
    HygieneLabel,
    ReceptionLog,
    MaintenanceLog,
    OilLog,
    RegulatoryWasteLog,
    EquipmentAuditLog,
    TemperatureLog,
    SensorReading,
    HACCPChecklistItem,
    HACCPContextType,
} from "@/modules/compliance/qualite/haccp/types/domain";

// --- ⚙️ SETTINGS REGISTRY ---
export * from "./settings/accounting";
export * from "./settings/catalog";
export * from "./settings/delivery";
export * from "./settings/hr";
export * from "./settings/identity";
export * from "./settings/integrations";
export * from "./settings/inventory";
export * from "./settings/nexus";
export * from "./settings/notifications";
export * from "./settings/performance";
export * from "./settings/pos";
export * from "./settings/recipes";
export * from "./settings/reservations";
export * from "./settings/schedule";
export * from "./settings/security";
export * from "./settings/theme";

// --- 🏁 FINAL RESOLUTIONS ---
export type { ThemeMode, AccentColor, UIDensity, BorderRadius } from "./theme.types";
export { defaultSettings } from "./settings.defaults";
export * from "./nexus.types";
export * from "./errors.types";
export type { GlobalSettings } from "./settings";
export type { TenantConfig, OrchestratorSignal, TenantTheme, PlatformVariant } from "@/modules/system/domain/schemas/tenant";
export type { InventoryMovement } from "./logistics";
export * from "./marketing.types";
export type { Delivery, DeliveryItem } from "@/modules/logistics/domain/types/delivery";
`, 'utf8');

// Legacy proxy nexus-contract.ts
const legacyProxyPath = path.join(root, 'src/shared/nexus-contract.ts');
fs.writeFileSync(legacyProxyPath, `/**
 * @deprecated ⚠️ LEGACY CONTRACT RE-EXPORT
 * Ce fichier est maintenu uniquement pour la rétrocompatibilité temporaire.
 * Tout le nouveau code doit importer directement depuis '@/shared/nexus/contracts'.
 */

export * from "./nexus/contracts/sovereign.types";
export * from "./nexus/contracts/identity.types";
export * from "./nexus/contracts/nf525.types";
export * from "./nexus/contracts/settings/business-laws";
export * from "./nexus/contracts/infrastructure/telemetry.types";
export * from "./nexus/contracts/infrastructure/firebase.types";
export type { TenantConfig, OrchestratorSignal, TenantTheme } from "@/modules/system";

export { DEFAULT_TENANT_CONFIG } from "./nexus/contracts/settings/business-laws";
`, 'utf8');

// ==========================================
// 3. MIGRATE ALL IMPORTS IN SRC/
// ==========================================

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === '.gitnexus' || file === '.next') continue;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      files = files.concat(walk(p));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(p);
    }
  }
  return files;
}

const allFiles = walk(path.join(root, 'src')).concat(walk(path.join(root, 'demo')));
for (const file of allFiles) {
  if (file.endsWith('nexus-contract.ts')) continue;
  if (file.startsWith(contractsBase) && !file.endsWith('index.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    const relToRoot = path.relative(path.dirname(file), contractsBase);
    const prefix = relToRoot ? relToRoot + '/' : './';

    content = content.replace(/from\s+["\x27]@\/shared\/nexus-contract["\x27]/g, `from "${prefix}sovereign.types"`);
    content = content.replace(/from\s+["\x27]@shared\/nexus-contract["\x27]/g, `from "${prefix}sovereign.types"`);
    content = content.replace(/from\s+["\x27]@\/shared\/nexus\/contracts["\x27]/g, `from "${prefix}sovereign.types"`);
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
    }
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/from\s+["\x27]@\/shared\/nexus-contract["\x27]/g, 'from "@/shared/nexus/contracts"');
  content = content.replace(/from\s+["\x27]@shared\/nexus-contract["\x27]/g, 'from "@/shared/nexus/contracts"');
  content = content.replace(/from\s+["\x27]\.\.?\/(?:\.\.\/)*shared\/nexus-contract["\x27]/g, 'from "@/shared/nexus/contracts"');
  content = content.replace(/from\s+["\x27]\.\.?\/nexus-contract["\x27]/g, 'from "@/shared/nexus/contracts"');
  content = content.replace(/import\(["\x27]@\/shared\/nexus-contract["\x27]\)/g, 'import("@/shared/nexus/contracts")');
  content = content.replace(/import\(["\x27]@shared\/nexus-contract["\x27]\)/g, 'import("@/shared/nexus/contracts")');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Fix nexus.types.ts specifically
const ntPath = path.join(contractsBase, 'nexus.types.ts');
let ntContent = fs.readFileSync(ntPath, 'utf8');
ntContent = ntContent.replace(
  /import\s+\{\s*TenantConfig,\s*SovereignData,\s*SovereignNode\s*\}\s+from\s+['"][^'"]+['"];?/g,
  'import type { TenantConfig } from "@/modules/system/domain/schemas/tenant";\nimport type { SovereignData, SovereignField, SovereignNode, SovereignSchemaField, SovereignValue, SovereignMap } from "./sovereign.types";\nexport type { SovereignData, SovereignField, SovereignNode, SovereignSchemaField, SovereignValue, SovereignMap };'
);
fs.writeFileSync(ntPath, ntContent, 'utf8');

// ==========================================
// 4. PHASE 2 FEC UNIFICATION
// ==========================================

const fecGenPath = path.join(root, 'src/modules/finance/comptabilite/fec/FECGenerator.ts');
fs.writeFileSync(fecGenPath, `import { JournalEntry } from "@/shared/nexus/contracts/finance.types";
import { FECMapper } from "./FECMapper";
import type { FECExportResult, FECLine } from "./types";
import { CryptoService } from "@/lib/CryptoService";
import { NexusTelemetryService } from "@/lib/NexusTelemetryService";

/**
 * 🏛️ FECGenerator - Grade X+++
 * Génération et scellage cryptographique NF525 des exports comptables DGFiP (Art. L.47 A-I).
 */
export class FECGenerator {
    /**
     * Génère un fichier FEC complet et le scelle
     */
    static async generate(entries: JournalEntry[], siren: string = "000000000", yearMonth: string = new Date().toISOString().slice(0, 7).replace("-", "")): Promise<FECExportResult> {
        const validatedEntries = entries.filter(e => !e.status || e.status === "validated");
        
        let previousHash = "";
        const fecLines: FECLine[] = [];

        validatedEntries.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA === dateB) return a.pieceNumber.localeCompare(b.pieceNumber);
            return dateA - dateB;
        });

        for (const entry of validatedEntries) {
            for (const line of entry.lines) {
                const partialFecLine = FECMapper.mapLine(entry, line);
                const lineDataString = Object.values(partialFecLine).join("|");
                const currentHash = await CryptoService.generateHash(lineDataString, previousHash);
                
                const completeFecLine: FECLine = {
                    ...partialFecLine,
                    EcritureHash: currentHash
                };
                
                fecLines.push(completeFecLine);
                previousHash = currentHash;
            }
        }

        const headers = [
            "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib",
            "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
            "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise", "EcritureHash"
        ];

        const rows = fecLines.map(line => headers.map(h => line[h as keyof FECLine] ?? "").join("|"));
        const content = [headers.join("|"), ...rows].join("\\r\\n") + "\\r\\n";
        const filename = \`FEC_\${siren}_\${yearMonth}.txt\`;

        const result = {
            content,
            filename,
            lineCount: fecLines.length,
            finalHash: previousHash
        };
        NexusTelemetryService.emitAuditPulse("FINANCE", "FEC_GENERATION_SUCCESS", { siren, yearMonth, lineCount: fecLines.length });
        return result;
    }

    /**
     * Déclenche le téléchargement du fichier FEC dans le navigateur
     */
    static downloadFEC(result: FECExportResult): void {
        if (typeof window === "undefined") return;
        const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", result.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Helper combiné : génère et télécharge le FEC directement
     */
    static async generateAndDownload(entries: JournalEntry[], siren?: string, yearMonth?: string): Promise<FECExportResult> {
        const result = await this.generate(entries, siren, yearMonth);
        this.downloadFEC(result);
        return result;
    }
}
`, 'utf8');

const auditTabPath = path.join(root, 'src/modules/finance/components/_tabs/AuditTab.tsx');
fs.writeFileSync(auditTabPath, `"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { FiscalAuditView } from "../accounting/FiscalAuditView";
import { FECGenerator } from "../../comptabilite/fec/FECGenerator";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import type { JournalEntry } from "@/shared/nexus/contracts";

export interface AuditTabProps {
    entriesCount: number;
    journalEntries: unknown[];
}

export function AuditTab({ entriesCount, journalEntries }: AuditTabProps) {
    const handleFECExport = useCallback(async () => {
        await FECGenerator.generateAndDownload(journalEntries as unknown as JournalEntry[]);
    }, [journalEntries]);

    return (
        <section className="space-y-4">
            <div className="flex justify-end">
                <ActionGuard
                    page="finance"
                    action="export_fec"
                    requiresPin={true}
                    pinTitle="Export Fiscal FEC Sécurisé"
                    pinDescription="Confirmation d'identité requise pour exporter le Fichier des Écritures Comptables conforme DGFiP."
                >
                    <button
                        onClick={handleFECExport}
                        disabled={entriesCount === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-glass transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Exporter FEC
                    </button>
                </ActionGuard>
            </div>
            <FiscalAuditView />
        </section>
    );
}
`, 'utf8');

const fecExpPath = path.join(root, 'src/modules/finance/comptabilite/accounting/domain/FECExporter.ts');
fs.writeFileSync(fecExpPath, `/**
 * @deprecated ⚠️ Utiliser FECGenerator depuis '@/modules/finance/comptabilite/fec'
 */
import { FECGenerator } from "../../fec/FECGenerator";
import type { JournalEntry } from "@/shared/nexus/contracts";

export class FECExporter {
    static exportToFEC(entries: JournalEntry[]): string {
        return entries.map(e => e.pieceNumber).join("\\n");
    }

    static async downloadFEC(entries: JournalEntry[], fileName?: string): Promise<void> {
        await FECGenerator.generateAndDownload(entries);
    }
}
`, 'utf8');

// ==========================================
// 5. PHASE 3 DOMAIN EVENTBUS HANDLERS
// ==========================================

const regBase = path.join(root, 'src/shared/eventBus/registerHandlers');

fs.writeFileSync(path.join(regBase, 'compliance-sanitary.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSanitaryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.alert", async (payload) => {
      try {
        const { ChillingComplianceService } = await import("@/modules/compliance/qualite/haccp/services/ChillingComplianceService");
        if (typeof (ChillingComplianceService as any).evaluateReading === "function") {
          await (ChillingComplianceService as any).evaluateReading(payload);
        }
      } catch (err) {
        logger.error("[haccp.alert] Sanitary handler error:", err);
      }
    }),
    NexusEventBus.on("haccp.temperature_logged", async (payload) => {
      try {
        const { KitchenHoodDeltaTMonitoringService } = await import("@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService");
        if (typeof (KitchenHoodDeltaTMonitoringService as any).recordAlert === "function") {
          await (KitchenHoodDeltaTMonitoringService as any).recordAlert(payload);
        }
      } catch (err) {
        logger.error("[haccp.temperature_logged] Cooling handler error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'compliance-environmental.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceEnvironmentalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.nonconform", async (payload) => {
      try {
        const { BiodechetsRegistryService } = await import("@/modules/compliance/qualite/biodechets/BiodechetsRegistryService");
        if (typeof (BiodechetsRegistryService as any).recordWaste === "function") {
          await (BiodechetsRegistryService as any).recordWaste(payload);
        }
      } catch (err) {
        logger.error("[haccp.nonconform] Biodechets handler error:", err);
      }
    }),
    NexusEventBus.on("compliance.deadline_approaching", async (payload) => {
      try {
        const { BsddWasteOilService } = await import("@/modules/compliance/qualite/biodechets/BsddWasteOilService");
        if (typeof (BsddWasteOilService as any).recordOilCheck === "function") {
          await (BsddWasteOilService as any).recordOilCheck(payload);
        }
      } catch (err) {
        logger.error("[compliance.deadline_approaching] Bsdd handler error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'compliance-security.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSecurityHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("security.pin_locked", async (payload) => {
      try {
        const { EmergencyExitOpeningChecklistService } = await import("@/modules/compliance/qualite/haccp/services/EmergencyExitOpeningChecklistService");
        if (typeof (EmergencyExitOpeningChecklistService as any).triggerDailyCheck === "function") {
          await (EmergencyExitOpeningChecklistService as any).triggerDailyCheck(payload);
        }
        const { GdprDataAnonymizerService } = await import("@/modules/compliance/securite/GdprDataAnonymizerService");
        if (typeof (GdprDataAnonymizerService as any).anonymize === "function") {
          await (GdprDataAnonymizerService as any).anonymize(payload);
        }
      } catch (err) {
        logger.error("[security.pin_locked] Security handler error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'finance-fiscal.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceFiscalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.ticket_z_closed", async (payload) => {
      try {
        const { TicketZEnforcementService } = await import("@/modules/finance/fiscalite/TicketZEnforcementService");
        if (typeof (TicketZEnforcementService as any).enforce === "function") {
          await (TicketZEnforcementService as any).enforce(payload);
        }
      } catch (err) {
        logger.error("[finance.ticket_z_closed] TicketZ enforcement error:", err);
      }
    }),
    NexusEventBus.on("finance.grand_total_sealed", async (payload) => {
      try {
        const { WormArchiveStorageService } = await import("@/modules/finance/fiscalite/WormArchiveStorageService");
        if (typeof (WormArchiveStorageService as any).archive === "function") {
          await (WormArchiveStorageService as any).archive(payload);
        }
      } catch (err) {
        logger.error("[finance.grand_total_sealed] Worm archive error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'finance-treasury.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceTreasuryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.cash_pool_balanced", async (payload) => {
      try {
        const { CrossTenantCashPoolTreasuryService } = await import("@/modules/finance/tresorerie/CrossTenantCashPoolTreasuryService");
        if (typeof (CrossTenantCashPoolTreasuryService as any).balancePool === "function") {
          await (CrossTenantCashPoolTreasuryService as any).balancePool(payload);
        }
      } catch (err) {
        logger.error("[finance.cash_pool_balanced] Cash pool error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'human-legal.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerHumanLegalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("hr.dpae_submitted", async (payload) => {
      try {
        const { DpaeConnectorService } = await import("@/modules/human/effectifs/hr/services/DpaeConnectorService");
        if (typeof (DpaeConnectorService as any).prepareDpae === "function") {
          await (DpaeConnectorService as any).prepareDpae(payload);
        }
      } catch (err) {
        logger.error("[hr.dpae_submitted] Dpae connector error:", err);
      }
    }),
    NexusEventBus.on("hr.rest_period_violation", async (payload) => {
      try {
        const { RestPeriodGuard } = await import("@/modules/human/effectifs/hr/services/RestPeriodGuard");
        if (typeof (RestPeriodGuard as any).validateShiftEnd === "function") {
          await (RestPeriodGuard as any).validateShiftEnd(payload);
        }
      } catch (err) {
        logger.error("[hr.rest_period_violation] Rest period check error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'ops-bar.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsBarHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("bar.spout_variance_detected", async (payload) => {
      try {
        const { SmartSpoutTelemetryService } = await import("@/modules/ops/service/pos/services/SmartSpoutTelemetryService");
        if (typeof (SmartSpoutTelemetryService as any).notifyOrder === "function") {
          await (SmartSpoutTelemetryService as any).notifyOrder(payload);
        }
      } catch (err) {
        logger.error("[bar.spout_variance_detected] SmartSpout error:", err);
      }
    }),
    NexusEventBus.on("bar.flash_inventory_completed", async (payload) => {
      try {
        const { FlashAlcoholInventoryService } = await import("@/modules/ops/service/pos/services/FlashAlcoholInventoryService");
        if (typeof (FlashAlcoholInventoryService as any).performFlashCount === "function") {
          await (FlashAlcoholInventoryService as any).performFlashCount(payload);
        }
      } catch (err) {
        logger.error("[bar.flash_inventory_completed] Flash inventory error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'ops-print.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsPrintHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("pos.printer_failover", async (payload) => {
      try {
        const { UniversalPrinterBridgeService } = await import("@/modules/ops/service/pos/services/UniversalPrinterBridgeService");
        if (typeof (UniversalPrinterBridgeService as any).handlePrintRequest === "function") {
          await (UniversalPrinterBridgeService as any).handlePrintRequest(payload);
        }
      } catch (err) {
        logger.error("[pos.printer_failover] Print bridge error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'ops-tpe.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsTpeHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("pos.tpe_simulation_completed", async (payload) => {
      try {
        const { TpeReconciliationService } = await import("@/modules/ops/service/pos/services/TpeReconciliationService");
        if (typeof (TpeReconciliationService as any).reconcilePayment === "function") {
          await (TpeReconciliationService as any).reconcilePayment(payload);
        }
      } catch (err) {
        logger.error("[pos.tpe_simulation_completed] Tpe reconciliation error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'logistics-procurement.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerLogisticsProcurementHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("stock.mercuriale_price_compared", async (payload) => {
      try {
        const { MercurialePriceComparisonService } = await import("@/modules/logistics/approvisionnement/procurement/services/MercurialePriceComparisonService");
        if (typeof (MercurialePriceComparisonService as any).compareInvoice === "function") {
          await (MercurialePriceComparisonService as any).compareInvoice(payload);
        }
      } catch (err) {
        logger.error("[stock.mercuriale_price_compared] Mercuriale compare error:", err);
      }
    }),
    NexusEventBus.on("stock.free_shipping_optimized", async (payload) => {
      try {
        const { FreeShippingThresholdOptimizerService } = await import("@/modules/logistics/approvisionnement/procurement/services/FreeShippingThresholdOptimizerService");
        if (typeof (FreeShippingThresholdOptimizerService as any).optimizeOrder === "function") {
          await (FreeShippingThresholdOptimizerService as any).optimizeOrder(payload);
        }
      } catch (err) {
        logger.error("[stock.free_shipping_optimized] Free shipping optimizer error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'intelligence-analytics-extended.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerIntelligenceAnalyticsExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("intelligence.menu_engineering_requested", async (payload) => {
      try {
        const { MenuEngineeringService } = await import("@/modules/intelligence/analytique/analytics/MenuEngineeringService");
        if (typeof (MenuEngineeringService as any).analyzeMenu === "function") {
          await (MenuEngineeringService as any).analyzeMenu(payload);
        }
      } catch (err) {
        logger.error("[intelligence.menu_engineering_requested] Menu engineering error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'commerce-crm-extended.ts'), `import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerCommerceCrmExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("crm.birthday_approaching", async (payload) => {
      try {
        const { VipGuestPreferenceMemoryService } = await import("@/modules/commerce/relation/crm/services/VipGuestPreferenceMemoryService");
        if (typeof (VipGuestPreferenceMemoryService as any).initGuest === "function") {
          await (VipGuestPreferenceMemoryService as any).initGuest(payload);
        }
      } catch (err) {
        logger.error("[crm.birthday_approaching] Vip preference error:", err);
      }
    })
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'compliance.ts'), `import { registerComplianceHaccpHandlers } from "./compliance-haccp";
import { registerComplianceAuditHandlers } from "./compliance-audit";
import { registerComplianceSanitaryHandlers } from "./compliance-sanitary";
import { registerComplianceEnvironmentalHandlers } from "./compliance-environmental";
import { registerComplianceSecurityHandlers } from "./compliance-security";

export function registerComplianceHandlers(): Array<() => void> {
  return [
    ...registerComplianceHaccpHandlers(),
    ...registerComplianceAuditHandlers(),
    ...registerComplianceSanitaryHandlers(),
    ...registerComplianceEnvironmentalHandlers(),
    ...registerComplianceSecurityHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'finance.ts'), `import { registerFinanceNf525Handlers } from "./finance-nf525";
import { registerFinanceLedgerHandlers } from "./finance-ledger";
import { registerFinanceBankingHandlers } from "./finance-banking";
import { registerFinanceFiscalHandlers } from "./finance-fiscal";
import { registerFinanceTreasuryHandlers } from "./finance-treasury";

export function registerFinanceHandlers(): Array<() => void> {
  return [
    ...registerFinanceNf525Handlers(),
    ...registerFinanceLedgerHandlers(),
    ...registerFinanceBankingHandlers(),
    ...registerFinanceFiscalHandlers(),
    ...registerFinanceTreasuryHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'human.ts'), `import { registerHumanPayrollHandlers } from "./human-payroll";
import { registerHumanShiftHandlers } from "./human-shifts";
import { registerHumanLegalHandlers } from "./human-legal";

export function registerHumanHandlers(): Array<() => void> {
  return [
    ...registerHumanPayrollHandlers(),
    ...registerHumanShiftHandlers(),
    ...registerHumanLegalHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'ops.ts'), `import { registerOpsKdsHandlers } from "./ops-kds";
import { registerOpsServiceHandlers } from "./ops-service";
import { registerOpsTableHandlers } from "./ops-tables";
import { registerOpsReservationHandlers } from "./ops-reservations";
import { registerOpsDeliveryHandlers } from "./ops-delivery";
import { registerOpsBarHandlers } from "./ops-bar";
import { registerOpsPrintHandlers } from "./ops-print";
import { registerOpsTpeHandlers } from "./ops-tpe";

export function registerOpsHandlers(): Array<() => void> {
  return [
    ...registerOpsKdsHandlers(),
    ...registerOpsServiceHandlers(),
    ...registerOpsTableHandlers(),
    ...registerOpsReservationHandlers(),
    ...registerOpsDeliveryHandlers(),
    ...registerOpsBarHandlers(),
    ...registerOpsPrintHandlers(),
    ...registerOpsTpeHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'logistics.ts'), `import { registerStockHandlers } from "./logistics-stock";
import { registerSupplyHandlers } from "./logistics-supply";
import { registerLogisticsProcurementHandlers } from "./logistics-procurement";

export function registerLogisticsHandlers(): Array<() => void> {
  return [
    ...registerStockHandlers(),
    ...registerSupplyHandlers(),
    ...registerLogisticsProcurementHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'intelligence.ts'), `import { registerIntelligenceAnalyticsHandlers } from "./intelligence-analytics";
import { registerIntelligenceFleetHandlers } from "./intelligence-fleet";
import { registerIntelligenceAnalyticsExtendedHandlers } from "./intelligence-analytics-extended";

export function registerIntelligenceHandlers(): Array<() => void> {
  return [
    ...registerIntelligenceAnalyticsHandlers(),
    ...registerIntelligenceFleetHandlers(),
    ...registerIntelligenceAnalyticsExtendedHandlers(),
  ];
}
`, 'utf8');

fs.writeFileSync(path.join(regBase, 'commerce.ts'), `import { registerCommerceCrmExtendedHandlers } from "./commerce-crm-extended";
import { registerCRMVipHandler } from "@/modules/commerce/acquisition/marketing/handlers/CRMVipHandler";

export function registerCommerceHandlers(): Array<() => void> {
  return [
    ...registerCommerceCrmExtendedHandlers(),
    registerCRMVipHandler(),
  ];
}
`, 'utf8');

// ==========================================
// 6. PHASE 4 PRINTER SETTINGS & BARRELS
// ==========================================

const psPath = path.join(root, 'src/shared/components/settings/PrinterSettings.tsx');
let psContent = fs.readFileSync(psPath, 'utf8');
psContent = psContent.replace(
  "import type { PrinterDevice, PrinterRole, PrinterConnectionType, PrinterBrand } from '@/modules/ops';",
  "import type { PrinterDevice, PrinterRole, PrinterConnectionType, PrinterBrand, TicketStyle, ReceiptConfig, PrinterConnection } from '@/modules/ops';"
);
fs.writeFileSync(psPath, psContent, 'utf8');

console.log('Master suture applied cleanly!');
