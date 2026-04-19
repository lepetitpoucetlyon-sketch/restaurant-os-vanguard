/**
 * 🛡️ GENOME VALIDATOR — Grade IX (Système Immunitaire)
 * 
 * Le gardien impitoyable de la cohérence du Sovereign Blob-OS.
 * 
 * Trois barrières de sécurité :
 *   1. STATUS_IMMUNITY — Un module RED ne peut rien faire.
 *   2. DNA_GUARD — Seuls les pouvoirs déclarés dans le génome sont autorisés.
 *   3. CIRCUIT_BREAKER — Si une dépendance obligatoire est RED, l'action est bloquée.
 * 
 * Performance : Sub-microseconde (pure mémoire, zéro async, zéro réseau).
 * 
 * "La valeur d'un système ne vient pas de ce qu'il permet,
 *  mais de ce qu'il INTERDIT."
 */

import type { ModuleId, PowerAction, ModuleGenome, GenomeRegistry, ModuleConnection } from '@/shared/genome.types';

// ═══════════════════════════════════════════════════
// 🧬 MASTER GENOME REGISTRY (Les 35 ADN)
// ═══════════════════════════════════════════════════

const MASTER_GENOME: GenomeRegistry = {
  version: '1.3.0',
  lastMutation: new Date().toISOString(),
  modules: {
    // ── INFRASTRUCTURE ──
    DASHBOARD: {
      id: 'DASHBOARD', status: 'GREEN', sutureLevel: 100, logicLevel: 100,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [
        { target: 'FLEET', reason: 'Pilotage Nodes', isMandatory: true },
        { target: 'BI', reason: 'Vision Macro', isMandatory: false }
      ]
    },
    AI_INTEL: {
      id: 'AI_INTEL', status: 'GREEN', sutureLevel: 80, logicLevel: 70,
      powers: ['READ_ONLY', 'SYNC_STATE'],
      linkedTo: [{ target: 'DASHBOARD', reason: 'Source Données', isMandatory: false }]
    },
    MAP_3D: {
      id: 'MAP_3D', status: 'GREEN', sutureLevel: 70, logicLevel: 60,
      powers: ['READ_ONLY'],
      linkedTo: [{ target: 'FLOOR_PLAN', reason: 'Données Spatiales', isMandatory: false }]
    },

    // ── OPÉRATIONS ──
    POS: {
      id: 'POS', status: 'GREEN', sutureLevel: 100, logicLevel: 95,
      powers: ['CREATE_TRANSACTION', 'SEAL_FISCAL'],
      linkedTo: [
        { target: 'REGISTERS', reason: 'Scellage Fiscal NF525', isMandatory: true },
        { target: 'KDS', reason: 'Envoi Commande', isMandatory: true },
        { target: 'CRM', reason: 'Fidélisation', isMandatory: false }
      ]
    },
    FLOOR_PLAN: {
      id: 'FLOOR_PLAN', status: 'GREEN', sutureLevel: 90, logicLevel: 85,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'RESERVATIONS', reason: 'Occupation Table', isMandatory: false }]
    },
    KDS: {
      id: 'KDS', status: 'GREEN', sutureLevel: 100, logicLevel: 100,
      powers: ['FIRE_KDS', 'VALIDATE_DISH', 'DECREMENT_STOCK'],
      linkedTo: [
        { target: 'POS', reason: 'Origine Commande', isMandatory: true },
        { target: 'INVENTORY', reason: 'Sortie Ingrédients', isMandatory: true }
      ]
    },
    RESERVATIONS: {
      id: 'RESERVATIONS', status: 'GREEN', sutureLevel: 85, logicLevel: 80,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [
        { target: 'CRM', reason: 'Historique Client', isMandatory: false },
        { target: 'FLOOR_PLAN', reason: 'Occupation Table', isMandatory: false }
      ]
    },
    OMNI_RES: {
      id: 'OMNI_RES', status: 'GREEN', sutureLevel: 70, logicLevel: 65,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'RESERVATIONS', reason: 'Canal Unique', isMandatory: true }]
    },

    // ── RELATION CLIENT ──
    CRM: {
      id: 'CRM', status: 'GREEN', sutureLevel: 80, logicLevel: 75,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'POS', reason: 'Historique Achat', isMandatory: false }]
    },
    QUOTES: {
      id: 'QUOTES', status: 'GREEN', sutureLevel: 60, logicLevel: 55,
      powers: ['CREATE_TRANSACTION', 'READ_ONLY'],
      linkedTo: [{ target: 'CRM', reason: 'Client Associé', isMandatory: false }]
    },
    GROUPS: {
      id: 'GROUPS', status: 'GREEN', sutureLevel: 75, logicLevel: 70,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'RESERVATIONS', reason: 'Résa Groupe', isMandatory: false }]
    },
    // PMS module removed - integrated into FLOOR_PLAN and RESERVATIONS.

    // ── PRODUCTION ──
    KITCHEN: {
      id: 'KITCHEN', status: 'GREEN', sutureLevel: 95, logicLevel: 90,
      powers: ['FIRE_KDS', 'VALIDATE_DISH', 'READ_ONLY'],
      linkedTo: [
        { target: 'KDS', reason: 'Commandes Actives', isMandatory: true },
        { target: 'INVENTORY', reason: 'Ingrédients', isMandatory: true }
      ]
    },
    BAR: {
      id: 'BAR', status: 'GREEN', sutureLevel: 85, logicLevel: 80,
      powers: ['FIRE_KDS', 'VALIDATE_DISH', 'READ_ONLY'],
      linkedTo: [{ target: 'KDS', reason: 'Commandes Boissons', isMandatory: true }]
    },
    STORAGE_MAP: {
      id: 'STORAGE_MAP', status: 'GREEN', sutureLevel: 70, logicLevel: 65,
      powers: ['READ_ONLY', 'SYNC_STATE'],
      linkedTo: [{ target: 'INVENTORY', reason: 'Localisations', isMandatory: true }]
    },

    // ── BACK-OFFICE ──
    INVENTORY: {
      id: 'INVENTORY', status: 'GREEN', sutureLevel: 100, logicLevel: 90,
      powers: ['DECREMENT_STOCK', 'LOG_TRACEABILITY', 'ALERT_RUPTURE'],
      linkedTo: [
        { target: 'KDS', reason: 'Consommation', isMandatory: true },
        { target: 'HACCP', reason: 'Traçabilité', isMandatory: true }
      ]
    },
    HACCP: {
      id: 'HACCP', status: 'GREEN', sutureLevel: 100, logicLevel: 90,
      powers: ['LOG_TRACEABILITY', 'SIG_DIGITAL', 'RECORD_TEMPERATURE', 'EXPORT_REGISTER'],
      linkedTo: [
        { target: 'INVENTORY', reason: 'Lien Matière', isMandatory: true },
        { target: 'REGISTERS', reason: 'Conformité Légale', isMandatory: true }
      ]
    },
    RECEPTION: {
      id: 'RECEPTION', status: 'GREEN', sutureLevel: 85, logicLevel: 80,
      powers: ['LOG_TRACEABILITY', 'SIG_DIGITAL'],
      linkedTo: [{ target: 'INVENTORY', reason: 'Entrée Stock', isMandatory: true }]
    },

    // ── RH & PLANNING ──
    CLOCK_IN: {
      id: 'CLOCK_IN', status: 'GREEN', sutureLevel: 80, logicLevel: 75,
      powers: ['CLOCK_STAFF', 'READ_ONLY'],
      linkedTo: [{ target: 'HR', reason: 'Registre Présence', isMandatory: true }]
    },
    HR: {
      id: 'HR', status: 'GREEN', sutureLevel: 80, logicLevel: 80,
      powers: ['CALCULATE_HOURS', 'SIGN_CONTRACT', 'CLOCK_STAFF'],
      linkedTo: [
        { target: 'PLANNING', reason: 'Emploi du Temps', isMandatory: true },
        { target: 'LEAVE', reason: 'Soldes Congés', isMandatory: false }
      ]
    },
    PLANNING: {
      id: 'PLANNING', status: 'GREEN', sutureLevel: 80, logicLevel: 75,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'HR', reason: 'Staff Disponible', isMandatory: true }]
    },
    LEAVE: {
      id: 'LEAVE', status: 'GREEN', sutureLevel: 70, logicLevel: 65,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'HR', reason: 'Validation RH', isMandatory: true }]
    },
    RECRUITMENT: {
      id: 'RECRUITMENT', status: 'YELLOW', sutureLevel: 40, logicLevel: 35,
      powers: ['READ_ONLY'],
      linkedTo: [{ target: 'HR', reason: 'Pipeline Recrutement', isMandatory: false }]
    },

    // ── INTELLIGENCE & CROISSANCE ──
    BI: {
      id: 'BI', status: 'GREEN', sutureLevel: 85, logicLevel: 80,
      powers: ['READ_ONLY', 'SYNC_STATE'],
      linkedTo: [{ target: 'DASHBOARD', reason: 'Export Analytique', isMandatory: false }]
    },
    GOOGLE_ANALYTICS: {
      id: 'GOOGLE_ANALYTICS', status: 'GREEN', sutureLevel: 60, logicLevel: 55,
      powers: ['READ_ONLY'],
      linkedTo: [{ target: 'BI', reason: 'Source Données', isMandatory: false }]
    },
    MARKETING: {
      id: 'MARKETING', status: 'GREEN', sutureLevel: 75, logicLevel: 70,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'CRM', reason: 'Segments Client', isMandatory: false }]
    },
    AI_REFERENCING: {
      id: 'AI_REFERENCING', status: 'GREEN', sutureLevel: 80, logicLevel: 75,
      powers: ['PUSH_GENOME', 'READ_ONLY'],
      linkedTo: [{ target: 'SEO', reason: 'Données Structurées', isMandatory: false }]
    },
    SEO: {
      id: 'SEO', status: 'GREEN', sutureLevel: 65, logicLevel: 60,
      powers: ['READ_ONLY', 'SYNC_STATE'],
      linkedTo: [{ target: 'MARKETING', reason: 'Visibilité', isMandatory: false }]
    },

    // ── GOUVERNANCE FINANCIÈRE ──
    TREASURY: {
      id: 'TREASURY', status: 'GREEN', sutureLevel: 70, logicLevel: 65,
      powers: ['READ_ONLY', 'SYNC_STATE'],
      linkedTo: [{ target: 'ACCOUNTING', reason: 'Flux Trésorerie', isMandatory: true }]
    },
    ACCOUNTING: {
      id: 'ACCOUNTING', status: 'GREEN', sutureLevel: 90, logicLevel: 90,
      powers: ['GENERATE_FEC', 'CLOSE_PERIOD', 'VENTILATE_TVA'],
      linkedTo: [
        { target: 'REGISTERS', reason: 'Scellage', isMandatory: true },
        { target: 'POS', reason: 'Flux Caisse', isMandatory: true },
        { target: 'TREASURY', reason: 'Ventilation TVA', isMandatory: true }
      ]
    },
    REGISTERS: {
      id: 'REGISTERS', status: 'GREEN', sutureLevel: 95, logicLevel: 95,
      powers: ['SEAL_FISCAL', 'EXPORT_REGISTER', 'READ_ONLY'],
      linkedTo: [{ target: 'POS', reason: 'Source Transactions', isMandatory: true }]
    },

    // ── SOUVERAINETÉ ──
    SETTINGS: {
      id: 'SETTINGS', status: 'GREEN', sutureLevel: 100, logicLevel: 100,
      powers: ['SYNC_STATE', 'PUSH_GENOME'],
      linkedTo: [{ target: 'FLEET', reason: 'Config Globale', isMandatory: true }]
    },
    ACCESS: {
      id: 'ACCESS', status: 'GREEN', sutureLevel: 90, logicLevel: 85,
      powers: ['SYNC_STATE', 'READ_ONLY'],
      linkedTo: [{ target: 'SETTINGS', reason: 'Politique Accès', isMandatory: true }]
    },
    FLEET: {
      id: 'FLEET', status: 'GREEN', sutureLevel: 100, logicLevel: 100,
      powers: ['PUSH_GENOME', 'KILL_SWITCH', 'SYNC_STATE'],
      linkedTo: [{ target: 'SETTINGS', reason: 'Injection ADN', isMandatory: true }]
    },
    ANTIGRAVITY: {
      id: 'ANTIGRAVITY', status: 'GREEN', sutureLevel: 100, logicLevel: 100,
      powers: ['PUSH_GENOME', 'SYNC_STATE'],
      linkedTo: [{ target: 'FLEET', reason: 'Orchestration IA', isMandatory: true }]
    }
  }
};

// ═══════════════════════════════════════════════════
// 🛡️ VALIDATOR ENGINE (Sub-microseconde)
// ═══════════════════════════════════════════════════

export class GenomeValidator {
  private static instance: GenomeValidator;
  private registry: GenomeRegistry;

  private constructor() {
    this.registry = MASTER_GENOME;
  }

  static getInstance(): GenomeValidator {
    if (!GenomeValidator.instance) {
      GenomeValidator.instance = new GenomeValidator();
    }
    return GenomeValidator.instance;
  }

  /**
   * 🛡️ RUTHLESS VALIDATION
   * Vérifie si un module peut exécuter un pouvoir.
   * 
   * Retourne un objet détaillé pour alimenter la Boîte Noire.
   * Performance : O(1) lookup + O(n) sur max 5 liaisons = sub-µs.
   */
  validatePower(moduleId: ModuleId, action: PowerAction): ValidationResult {
    const genome = this.registry.modules[moduleId];

    // Gate 0: Module inconnu
    if (!genome) {
      return { allowed: false, reason: 'UNREGISTERED_MODULE', moduleId, action };
    }

    // Gate 1: STATUS_IMMUNITY — Module en état critique
    if (genome.status === 'RED') {
      return { allowed: false, reason: 'MODULE_RED', moduleId, action };
    }

    // Gate 2: DNA_GUARD — Pouvoir non déclaré dans l'ADN
    if (!genome.powers.includes(action)) {
      return { allowed: false, reason: 'DNA_CORRUPTION', moduleId, action };
    }

    // Gate 3: CIRCUIT_BREAKER — Liaison vitale rompue
    for (const link of genome.linkedTo) {
      if (link.isMandatory) {
        const target = this.registry.modules[link.target];
        if (!target || target.status === 'RED') {
          return { 
            allowed: false, 
            reason: 'LINK_BROKEN', 
            moduleId, 
            action, 
            blockedDependency: link.target 
          };
        }
      }
    }

    return { allowed: true, reason: 'AUTHORIZED', moduleId, action };
  }

  /**
   * 🧬 DNA MORPH — Mutation contrôlée du statut d'un module.
   */
  mutateNodeStatus(moduleId: ModuleId, newStatus: 'GREEN' | 'YELLOW' | 'RED'): void {
    if (this.registry.modules[moduleId]) {
      this.registry.modules[moduleId].status = newStatus;
      this.registry.lastMutation = new Date().toISOString();
    }
  }

  /**
   * Retourne le génome complet d'un module (lecture seule).
   */
  getModuleGenome(moduleId: ModuleId): ModuleGenome | undefined {
    return this.registry.modules[moduleId];
  }

  /**
   * Retourne la version du registre.
   */
  getRegistryVersion(): string {
    return this.registry.version;
  }
}

// ═══════════════════════════════════════════════════
// 📦 TYPES & EXPORTS
// ═══════════════════════════════════════════════════

export interface ValidationResult {
  allowed: boolean;
  reason: 'AUTHORIZED' | 'DNA_CORRUPTION' | 'LINK_BROKEN' | 'MODULE_RED' | 'UNREGISTERED_MODULE';
  moduleId: ModuleId | string;
  action: PowerAction | string;
  blockedDependency?: string;
}

/** Singleton exporté pour usage global */
export const genomeValidator = GenomeValidator.getInstance();
