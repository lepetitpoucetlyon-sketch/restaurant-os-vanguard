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
import type { ImmunityLogEntry, JetEntry } from '@shared/genome.types';

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
      await db.immunityLogs.add(fullEntry);
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
   * NF525 JET — Journal des Événements Techniques (append-only)
   */
  async logTechnicalEvent(entry: Omit<JetEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: JetEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    try {
      await db.jetEntries.add(fullEntry);
    } catch (error) {
      logger.error('[JET] Échec d\'écriture Dexie', error);
    }

    logger.warn(
      `[JET] ${entry.eventType} | ${entry.description} | Device: ${entry.deviceId}`
    );
  },

  async getJetEntries(limit: number = 200): Promise<JetEntry[]> {
    try {
      return await db.jetEntries
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
    const jet = await this.getJetEntries();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      systemVersion: 'Grade IX',
      totalRejections: logs.length,
      totalTechnicalEvents: jet.length,
      immunityEntries: logs,
      jetEntries: jet,
    }, null, 2);
  }
};
