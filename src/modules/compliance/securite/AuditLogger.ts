import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * AuditLogger — Journal d'audit inaltérable du MCC.
 *
 * ADR-014 (Consolidation fondations) — évolutions :
 * - Types AuditAction étendus (fiscal, sanitaire, RBAC, provisioning, IA)
 * - Hash chain SHA-256 : chaque log contient le hash du log précédent
 *   (immuabilité prouvable — modifier un log casse toute la chaîne suivante)
 * - Export forensique via AuditLogger.exportChain(fromTs, toTs) — retourne
 *   la chaîne complète + hash final signé, opposable en audit externe
 *
 * Stockage :
 *   mcc/audit_trail/{id}                — log individuel
 *   mcc/audit_chain/head                — { lastHash, lastId, count } (tête chaîne)
 */

export type AuditAction =
  // Kill switches / MCC ops
  | 'KILL_SWITCH_ACTIVATE'
  | 'KILL_SWITCH_DEACTIVATE'
  | 'DEVICE_MDM_LOCK'
  | 'DEVICE_MDM_UNLOCK'
  | 'RESELLER_DELETE'
  | 'COMMISSION_UPDATE'
  // Auth / RBAC
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'ROLE_ELEVATED'
  | 'ROLE_DEMOTED'
  | 'SESSION_REVOKED'
  | 'CROSS_SCOPE_GRANT'
  | 'CROSS_SCOPE_REVEAL'
  | 'CROSS_SCOPE_REVOKE'
  // Provisioning tenant
  | 'TENANT_PROVISIONED'
  | 'TENANT_DECOMMISSIONED'
  | 'TENANT_OVERRIDE_APPLIED'
  | 'TENANT_AI_CONFIG_UPDATED'
  | 'PUBLIC_ACCESS_UPDATED'
  // Fiscal / NF525
  | 'FISCAL_ARCHIVE_EXPORT'
  | 'FISCAL_SEAL_ANOMALY_DETECTED'
  | 'GRAND_TOTAL_COMPUTED'
  | 'TICKET_Z_GENERATED'
  | 'FEC_EXPORTED'
  | 'DGFIP_INSPECTION_MODE'
  // HACCP / sanitaire
  | 'HACCP_ALERT_RAISED'
  | 'CHILLING_NONCONFORM'
  | 'RECALL_BROADCAST'
  | 'TIAC_INCIDENT_OPENED'
  | 'ALLERGEN_ORDER_BLOCKED'
  // RGPD / données personnelles
  | 'RGPD_PURGE_REQUESTED'
  | 'CUSTOMER_MASS_EXPORT'
  // Payments / cash
  | 'CASH_DRAWER_VARIANCE'
  | 'REFUND_PROCESSED'
  | 'TIP_REDISTRIBUTED'
  // POS ops
  | 'TABLE_TRANSFERRED'
  | 'TABLES_MERGED'
  | 'COMMERCIAL_GESTURE'
  | 'TIP_RECORDED'
  | 'TPE_REDEBIT_BLOCKED'
  | 'CODE_AMBRE_TRIGGERED'
  | 'CODE_AMBRE_RESOLVED'
  // Finance / fiscal
  | 'PROVISIONAL_SEAL_ANNULLED'
  | 'ADDON_TICKET_CREATED'
  | 'ADVANCE_INVOICE_ISSUED'
  | 'CASH_VARIANCE_RECORDED'
  | 'POS_OPEN_BLOCKED_MISSING_Z'
  | 'TVA_LIVRAISON_MISMATCH'
  | 'DUNNING_STEP_PROCESSED'
  // Compliance / sanitaire
  | 'DISINFECTION_SEQUENCE_VIOLATION'
  | 'INGREDIENT_EIGHTYSIXTED'
  | 'CO2_ALARM_TRIGGERED'
  | 'FIRE_SAFETY_TEST_RECORDED'
  | 'WATER_CUT_PROTOCOL_TRIGGERED'
  | 'WATER_CUT_RESOLVED'
  | 'BSDD_WASTE_OIL_RECORDED'
  | 'PURGE_BLOCKED_WORM'
  // Security / data
  | 'MASS_DATA_EXPORT_ALERT'
  | 'FIREBASE_CLAIMS_REFRESH_REQUESTED'
  | 'AOT_QUOTA_EXCEEDED'
  | 'TRUST_SCORE_FLAGGED'
  | 'DELIVERY_SCORE_ALERT'
  // HR
  | 'REST_PERIOD_VIOLATION'
  | 'WORK_ACCIDENT_DECLARED'
  // Logistics
  | 'SUPPLIER_PRICE_DEVIATION';

export interface AuditLog {
  id: string;
  adminId: string;
  action: AuditAction;
  targetId: string;
  ipAddress: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  /** Hash SHA-256 du log précédent (chaîne immuable). */
  previousHash: string;
  /** Hash SHA-256 de ce log (calculé sur toutes les autres propriétés). */
  hash: string;
}

interface ChainHead {
  lastHash: string;
  lastId: string | null;
  count: number;
  updatedAt: number;
}

const CHAIN_HEAD_PATH = 'mcc/audit_chain/head';
const LOG_PATH_PREFIX = 'mcc/audit_trail';
const GENESIS_HASH = 'GENESIS';

async function sha256(text: string): Promise<string> {
  // Environnement Node (server) : crypto natif
  if (typeof globalThis.crypto?.subtle === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }
  // Environnement browser / workerd
  const enc = new TextEncoder().encode(text);
  const buf = await globalThis.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeLogHash(log: Omit<AuditLog, 'hash'>): Promise<string> {
  const canonical = JSON.stringify({
    id: log.id,
    adminId: log.adminId,
    action: log.action,
    targetId: log.targetId,
    ipAddress: log.ipAddress,
    timestamp: log.timestamp,
    metadata: log.metadata ?? null,
    previousHash: log.previousHash,
  });
  return sha256(canonical);
}

async function loadHead(): Promise<ChainHead> {
  try {
    const head = await Nexus.adapter.get(CHAIN_HEAD_PATH) as ChainHead | null;
    if (head && typeof head === 'object' && typeof head.lastHash === 'string') return head;
  } catch (err) {
    logger.warn('[AuditLogger] Lecture head échouée — fallback GENESIS', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return { lastHash: GENESIS_HASH, lastId: null, count: 0, updatedAt: 0 };
}

/**
 * Journal d'audit inaltérable du MCC avec hash chain SHA-256.
 */
export class AuditLogger {
  static async logAction(
    adminId: string,
    action: AuditAction,
    targetId: string,
    metadata?: Record<string, unknown>,
    ipAddress: string = '0.0.0.0',
  ): Promise<AuditLog | null> {
    const head = await loadHead();
    const partial: Omit<AuditLog, 'hash'> = {
      id: crypto.randomUUID(),
      adminId,
      action,
      targetId,
      ipAddress,
      timestamp: Date.now(),
      metadata,
      previousHash: head.lastHash,
    };
    const hash = await computeLogHash(partial);
    const log: AuditLog = { ...partial, hash };

    logger.info(`[AUDIT TRAIL] [${action}] by ${adminId} on ${targetId} (hash=${hash.slice(0, 8)}…)`);

    try {
      await Nexus.adapter.set(`${LOG_PATH_PREFIX}/${log.id}`, log);
      const nextHead: ChainHead = {
        lastHash: hash,
        lastId: log.id,
        count: head.count + 1,
        updatedAt: log.timestamp,
      };
      await Nexus.adapter.set(CHAIN_HEAD_PATH, nextHead);
      return log;
    } catch (err) {
      logger.error(`[AUDIT TRAIL] ECHEC DE SAUVEGARDE`, err);
      return null;
    }
  }

  /**
   * Vérifie l'intégrité de la chaîne pour une plage donnée.
   * Retourne { valid, breaks: [{ id, expectedPrev, actualPrev }] }.
   */
  static async verifyChain(logs: AuditLog[]): Promise<{
    valid: boolean;
    breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }>;
  }> {
    const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);
    const breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }> = [];
    let expectedPrev = sorted[0]?.previousHash ?? GENESIS_HASH;

    for (const log of sorted) {
      if (log.previousHash !== expectedPrev) {
        breaks.push({ id: log.id, expectedPrev, actualPrev: log.previousHash });
      }
      // Vérifier que le hash du log correspond au recalcul
      // (on écarte proprement `hash` via déstructuration)
      const { hash: _hash, ...withoutHash } = log;
      void _hash;
      const recomputed = await computeLogHash(withoutHash);
      if (recomputed !== log.hash) {
        breaks.push({ id: log.id, expectedPrev: recomputed, actualPrev: log.hash });
      }
      expectedPrev = log.hash;
    }

    return { valid: breaks.length === 0, breaks };
  }

  /**
   * Export forensique : retourne la chaîne d'audit sur une période donnée,
   * accompagnée du hash final (opposable en audit externe).
   * Le caller peut sauvegarder ce JSON, le signer eIDAS, et le fournir à un
   * inspecteur DGFiP, un auditeur RGPD ou un juge d'instruction.
   */
  static async exportChain(fromTs: number, toTs: number): Promise<{
    logs: AuditLog[];
    fromTs: number;
    toTs: number;
    finalHash: string;
    count: number;
    exportedAt: string;
    integrityValid: boolean;
    breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }>;
  }> {
    // On lit tout puis on filtre côté client car Nexus adapter n'a pas de range query générique
    let all: AuditLog[] = [];
    try {
      all = (await Nexus.adapter.query<AuditLog>(LOG_PATH_PREFIX)) ?? [];
    } catch (err) {
      logger.error('[AuditLogger] Export chain — lecture échouée', err);
      return {
        logs: [], fromTs, toTs, finalHash: GENESIS_HASH, count: 0,
        exportedAt: new Date().toISOString(), integrityValid: false, breaks: [],
      };
    }

    const filtered = all
      .filter(l => l.timestamp >= fromTs && l.timestamp <= toTs)
      .sort((a, b) => a.timestamp - b.timestamp);

    const verification = await AuditLogger.verifyChain(filtered);
    const finalHash = filtered.length > 0 ? filtered[filtered.length - 1].hash : GENESIS_HASH;

    return {
      logs: filtered,
      fromTs,
      toTs,
      finalHash,
      count: filtered.length,
      exportedAt: new Date().toISOString(),
      integrityValid: verification.valid,
      breaks: verification.breaks,
    };
  }
}
