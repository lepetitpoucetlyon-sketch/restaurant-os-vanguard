/**
 * 📜 IMMUNITY AUDIT LOGGER — Grade IX (Boîte Noire)
 * 
 * Enregistre de manière INALTÉRABLE chaque rejet du GenomeValidator.
 * Stockage local Dexie (immunityLogs), synchronisable vers le Suzerain.
 * 
 * Chaque entrée répond aux questions :
 *   - QUI a tenté l'action ? (userId, tenantId)
 *   - QUAND ? (timestamp ISO)
 *   - QUOI ? (moduleId + attemptedPower)
 *   - POURQUOI bloqué ? (reason + blockedDependency)
 * 
 * "On ne se contente pas de rejeter l'action, on la DÉNONCE."
 */

import { db } from '@/lib/offline/offline-store';
import { logger } from '@/lib/logger';
import type { ImmunityLogEntry } from '@/shared/genome.types';

export const ImmunityAuditLogger = {

  /**
   * Grave un rejet dans la Boîte Noire locale.
   * Émet également un événement CustomEvent pour le SovereignShield UI.
   */
  async log(entry: Omit<ImmunityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: ImmunityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // 1. Persistance Dexie (inaltérable localement)
    try {
      await db.immunityLogs.add(fullEntry as any);
    } catch (error) {
      logger.error('[ImmunityAudit] Échec d\'écriture Dexie', error);
    }

    // 2. Log console (visible en dev ET en prod car c'est un événement de sécurité)
    logger.error(
      `[SOVEREIGN_GUARD] REJET | Module: ${entry.moduleId} | Action: ${entry.attemptedPower} | Raison: ${entry.reason}${entry.blockedDependency ? ` | Dépendance: ${entry.blockedDependency}` : ''}`
    );

    // 3. Émettre un événement pour le SovereignShield UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sovereign-guard-alert', {
        detail: fullEntry
      }));
    }
  },

  /**
   * Récupère tous les logs d'immunité (pour audit / export).
   */
  async getAll(): Promise<ImmunityLogEntry[]> {
    try {
      return await db.immunityLogs.toArray();
    } catch {
      return [];
    }
  },

  /**
   * Récupère les N derniers rejets.
   */
  async getRecent(limit: number = 50): Promise<ImmunityLogEntry[]> {
    try {
      return await db.immunityLogs
        .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();
    } catch {
      return [];
    }
  },

  /**
   * Export complet pour auditeur / régulateur fiscal.
   * Format JSON structuré.
   */
  async exportForAudit(): Promise<string> {
    const logs = await this.getAll();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      systemVersion: 'Grade IX',
      totalRejections: logs.length,
      entries: logs
    }, null, 2);
  }
};
