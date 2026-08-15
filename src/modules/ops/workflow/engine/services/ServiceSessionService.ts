import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export type ServiceSessionType = 'lunch' | 'dinner' | 'continuous' | 'night';

export interface ServiceSession {
  id: string;
  tenantId: string;
  serviceType: ServiceSessionType;
  businessDate: string; // Ex: "2026-08-15" (même pour les commandes passées à 02h00 le lendemain)
  openedAtUtc: string; // ISO UTC
  openedAtTimestamp: number;
  closedAtUtc?: string;
  closedAtTimestamp?: number;
  openedBy: string;
  closedBy?: string;
  status: 'OPEN' | 'CLOSED';
  ordersCount: number;
  totalRevenueInMicrounits: number;
}

export interface ShiftDurationResult {
  durationMs: number;
  decimalHours: number;
  formatted: string;
}

/**
 * ⏰ ServiceSessionService — Invariant #4 de la Charte Permanente d'Ingénierie
 *
 * 1. Isolation Temporelle UTC Absolue (Anti-DST) :
 *    Tous les calculs de durée de shift et vacations s'effectuent en millisecondes UTC absolues.
 * 2. Rattachement Métier Nocturne :
 *    Les commandes nocturnes (jusqu'à la fermeture du service) sont rattachées au serviceSessionId
 *    et à la businessDate du shift et non à la date civile du lendemain.
 */
export class ServiceSessionService {
  /**
   * Ouvre une nouvelle session de service pour le restaurant.
   */
  static async openSession(
    tenantId: string,
    serviceType: ServiceSessionType,
    openedBy: string,
    customBusinessDate?: string
  ): Promise<ServiceSession> {
    const now = Date.now();
    const nowUtc = new Date(now).toISOString();

    // Détermination de la date métier (Business Date)
    const businessDate = customBusinessDate || this.getComputedBusinessDate(now);
    const sessionId = `sess_${businessDate}_${serviceType}_${now}`;

    const session: ServiceSession = {
      id: sessionId,
      tenantId,
      serviceType,
      businessDate,
      openedAtUtc: nowUtc,
      openedAtTimestamp: now,
      openedBy,
      status: 'OPEN',
      ordersCount: 0,
      totalRevenueInMicrounits: 0,
    };

    // 1. Stocker la session active
    await Nexus.adapter.set(`tenants/${tenantId}/activeServiceSession`, session);
    // 2. Archiver dans l'historique des sessions
    await Nexus.adapter.set(`tenants/${tenantId}/serviceSessions/${sessionId}`, session);

    logger.info(`[ServiceSession] Session ${sessionId} ouverte pour ${businessDate} (${serviceType})`);

    return session;
  }

  /**
   * Récupère la session de service active pour le tenant.
   */
  static async getActiveSession(tenantId: string): Promise<ServiceSession | null> {
    try {
      const active = await Nexus.adapter.get<ServiceSession>(`tenants/${tenantId}/activeServiceSession`);
      if (active && active.status === 'OPEN') {
        return active;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clôture la session de service active.
   */
  static async closeSession(
    tenantId: string,
    sessionId: string,
    closedBy: string,
    summaryStats?: { ordersCount: number; totalRevenueInMicrounits: number }
  ): Promise<ServiceSession> {
    const now = Date.now();
    const nowUtc = new Date(now).toISOString();

    const session = await Nexus.adapter.get<ServiceSession>(`tenants/${tenantId}/serviceSessions/${sessionId}`);
    if (!session) {
      throw new Error(`Session introuvable: ${sessionId}`);
    }

    const closedSession: ServiceSession = {
      ...session,
      closedAtUtc: nowUtc,
      closedAtTimestamp: now,
      closedBy,
      status: 'CLOSED',
      ordersCount: summaryStats?.ordersCount ?? session.ordersCount,
      totalRevenueInMicrounits: summaryStats?.totalRevenueInMicrounits ?? session.totalRevenueInMicrounits,
    };

    // Mettre à jour l'archive
    await Nexus.adapter.set(`tenants/${tenantId}/serviceSessions/${sessionId}`, closedSession);
    // Supprimer le pointeur actif
    await Nexus.adapter.delete(`tenants/${tenantId}/activeServiceSession`);

    logger.info(`[ServiceSession] Session ${sessionId} clôturée par ${closedBy}`);
    return closedSession;
  }

  /**
   * Invariant #4 Anti-DST : Calcul absolu en millisecondes UTC de la durée de travail.
   * Totalement insensible aux changements d'heure (passage heure d'été / heure d'hiver).
   */
  static calculateShiftDurationUtc(startedAtUtc: string, endedAtUtc: string): ShiftDurationResult {
    const startMs = new Date(startedAtUtc).getTime();
    const endMs = new Date(endedAtUtc).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      return { durationMs: 0, decimalHours: 0, formatted: '0h 00m' };
    }

    const durationMs = Math.max(0, endMs - startMs);
    const decimalHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formatted = `${hours}h ${minutes.toString().padStart(2, '0')}m`;

    return {
      durationMs,
      decimalHours,
      formatted,
    };
  }

  /**
   * Détermine la date métier pour une commande ou un encaissement.
   * Si la commande a lieu entre minuit et 06h00 du matin, elle est rattachée au service de la veille.
   */
  static getComputedBusinessDate(timestamp: number = Date.now()): string {
    const date = new Date(timestamp);
    const hoursUtc = date.getUTCHours();

    // Règle nocturne : si l'heure est comprise entre 00h et 06h, rattacher à J-1
    if (hoursUtc < 6) {
      date.setUTCDate(date.getUTCDate() - 1);
    }

    return date.toISOString().split('T')[0];
  }
}
