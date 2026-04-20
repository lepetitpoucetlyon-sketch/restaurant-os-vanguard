// @ts-nocheck
/**
 * 🧬 GENOME TYPES — Grade IX (Morphogenèse)
 * Contrat de pouvoir immuable du Sovereign Blob-OS.
 * 
 * Ce fichier est la LOI CONSTITUTIONNELLE du système.
 * Toute action, liaison ou module qui n'est pas déclaré ici N'EXISTE PAS.
 */

// ═══════════════════════════════════════════════════
// 📛 MODULE IDENTITY (Les 35 Citoyens Autorisés)
// ═══════════════════════════════════════════════════

export type ModuleId =
  // Infrastructure (Colonne Vertébrale)
  | 'DASHBOARD' | 'AI_INTEL' | 'MAP_3D'
  // Opérations (Flux de Valeur)
  | 'POS' | 'FLOOR_PLAN' | 'KDS' | 'RESERVATIONS' | 'OMNI_RES'
  // Relation Client
  | 'CRM' | 'QUOTES' | 'GROUPS'
  // Production (Cuisine / Bar)
  | 'KITCHEN' | 'BAR' | 'STORAGE_MAP'
  // Back-Office (Stock & Conformité)
  | 'INVENTORY' | 'HACCP' | 'RECEPTION'
  // RH & Planning
  | 'CLOCK_IN' | 'HR' | 'PLANNING' | 'LEAVE' | 'RECRUITMENT'
  // Intelligence & Croissance
  | 'BI' | 'GOOGLE_ANALYTICS' | 'MARKETING' | 'AI_REFERENCING' | 'SEO'
  // Gouvernance Financière
  | 'TREASURY' | 'ACCOUNTING' | 'REGISTERS'
  // Souveraineté
  | 'SETTINGS' | 'ACCESS' | 'FLEET' | 'ANTIGRAVITY';

// ═══════════════════════════════════════════════════
// ⚡ POWER ACTIONS (Les Gestes Autorisés)
// ═══════════════════════════════════════════════════

export type PowerAction =
  // Flux Transactionnel
  | 'CREATE_TRANSACTION' | 'SEAL_FISCAL' | 'CLOSE_PERIOD'
  // Production
  | 'FIRE_KDS' | 'VALIDATE_DISH'
  // Stock & Traçabilité
  | 'DECREMENT_STOCK' | 'LOG_TRACEABILITY' | 'ALERT_RUPTURE'
  // Conformité
  | 'SIG_DIGITAL' | 'RECORD_TEMPERATURE' | 'EXPORT_REGISTER'
  // Comptabilité
  | 'GENERATE_FEC' | 'VENTILATE_TVA'
  // RH
  | 'CLOCK_STAFF' | 'SIGN_CONTRACT' | 'CALCULATE_HOURS'
  // Souveraineté
  | 'PUSH_GENOME' | 'KILL_SWITCH' | 'SYNC_STATE'
  // Universel
  | 'READ_ONLY';

// ═══════════════════════════════════════════════════
// 🔗 MODULE GENOME (L'ADN d'un Module)
// ═══════════════════════════════════════════════════

export interface ModuleConnection {
  /** Module cible de la liaison */
  target: ModuleId;
  /** Raison métier de la liaison */
  reason: string;
  /** Si true, le module est bloqué si la cible est RED */
  isMandatory: boolean;
}

export interface ModuleGenome {
  id: ModuleId;
  /** Santé du module : GREEN = opérationnel, YELLOW = dégradé, RED = bloqué */
  status: 'GREEN' | 'YELLOW' | 'RED';
  /** Actions autorisées pour ce module */
  powers: PowerAction[];
  /** Liaisons de dépendance vers d'autres modules */
  linkedTo: ModuleConnection[];
  /** Niveau de suture (0-100) — complétude de l'intégration */
  sutureLevel: number;
  /** Niveau logique (0-100) — maturité du code métier */
  logicLevel: number;
}

export interface GenomeRegistry {
  version: string;
  lastMutation: string;
  modules: Record<ModuleId, ModuleGenome>;
}

// ═══════════════════════════════════════════════════
// 📜 IMMUNITY LOG (La Boîte Noire)
// ═══════════════════════════════════════════════════

export interface ImmunityLogEntry {
  id?: number;
  timestamp: string;
  moduleId: ModuleId | string;
  attemptedPower: PowerAction | string;
  reason: 'DNA_CORRUPTION' | 'LINK_BROKEN' | 'MODULE_RED' | 'UNREGISTERED_MODULE' | 'UNKNOWN';
  blockedDependency?: string;
  tenantId?: string;
  userId?: string;
}
