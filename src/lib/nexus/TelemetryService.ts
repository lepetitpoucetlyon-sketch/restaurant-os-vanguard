import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDefaultStore } from 'jotai';
import { fiscalLedgerAtom } from '@/modules/haccp/store/complianceAtoms';
import { TelemetryPulse } from '@/shared/nexus-contract';
import { FiscalSeal } from '@/types';

interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NetworkInformation extends EventTarget {
  readonly effectiveType: string;
}

interface ExtendedNavigator extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * 💓 TelemetryService - The Nexus Heartbeat (Phase 3: Le Miroir)
 * Periodically reports the health and status of the OS back to the Suzerain (MCC).
 */
export class TelemetryService {
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static store = getDefaultStore();

  /**
   * Commence l'envoi périodique du heartbeat (chaque 5 minutes).
   */
  static start(tenantId: string) {
    this.stop(); // Cleanup previous if any

    console.log(`[TelemetryService] Heartbeat démarré pour ${tenantId} (Intervalle: 5min).`);

    // Initial beat
    this.sendPulse(tenantId);

    // Set interval (5 minutes = 300,000ms)
    this.heartbeatInterval = setInterval(() => {
      this.sendPulse(tenantId);
    }, 300000);
  }

  /**
   * Envoie un signal unique de santé vers Firestore.
   */
  private static async sendPulse(tenantId: string) {
    try {
      const firestore = getFirestore();
      // Path aligned with MCC Mirror dashboard
      const statusDocRef = doc(firestore, 'tenants', tenantId, 'status', 'heartbeat');

      // 1. Gather Battery Info
      let batteryInfo = { level: 1, charging: true, supported: false };
      const extendedNav = navigator as ExtendedNavigator;
      if (typeof extendedNav !== 'undefined' && extendedNav.getBattery) {
        try {
          const battery = await extendedNav.getBattery();
          batteryInfo = {
            level: battery.level,
            charging: battery.charging,
            supported: true
          };
        } catch (e) { /* Fallback */ }
      }

      // 2. Gather NF525 Status
      const ledgerData: import('@/shared/types/finance.types').JournalEntry[] = this.store.get(fiscalLedgerAtom);
      const isSealed = Array.isArray(ledgerData) && ledgerData.some(e => e.fiscalSealHash);
      const lastHash = isSealed ? ledgerData.find(e => e.fiscalSealHash)?.fiscalSealHash : undefined;

      // Type-safe connection check
      const connection = extendedNav.connection || extendedNav.mozConnection || extendedNav.webkitConnection;
      const effectiveType = connection?.effectiveType || 'SOVEREIGN_UNKNOWN';


      const payload: TelemetryPulse = {
        version: '9.0.0-grade-ix',
        status: 'ACTIVE',
        lastPulse: serverTimestamp() as any,
        health: {
          uptime: typeof process !== 'undefined' && process.uptime ? Math.floor(process.uptime()) : 0,
          battery: batteryInfo,
          network: {
            online: typeof navigator !== 'undefined' ? navigator.onLine : true,
            effectiveType
          }
        },
        security: {
          nf525Sealed: isSealed,
          lastSealHash: lastHash,
          integrityGrade: 'IX'
        }
      };

      await setDoc(statusDocRef, payload, { merge: true });
      console.log(`[TelemetryService] Heartbeat envoyé à ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.warn(`[TelemetryService] Échec du heartbeat:`, error);
    }
  }

  /**
   * 📢 Dénonce une anomalie TECHNIQUE au MCC (Anonymisation Totale).
   * INTERDICTION : Pas de montants, pas de noms, pas de PII.
   */
  static async reportIssue(code: 'FALLBACK_VALUE' | 'INTEGRITY_DRIFT' | 'AUTH_ANOMALY', source: string, techMetadata: { field: string, type?: string }) {
    try {
      const firestore = getFirestore();
      // ID d'incident totalement anonyme
      const issueId = `INCIDENT-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const issueRef = doc(firestore, 'system_alerts', issueId);
      
      await setDoc(issueRef, {
        code,
        source,
        techMetadata, // Uniquement des noms de champs/types
        timestamp: serverTimestamp(),
        version: '9.0.0-grade-ix',
        severity: code === 'INTEGRITY_DRIFT' ? 'CRITICAL' : 'WARNING'
      });
      
      console.warn(`[TelemetryService] TECHNICAL_SIGNAL_SENT: ${code} from ${source}`, techMetadata);
    } catch (e) {
      // Échec silencieux pour ne pas perturber l'expérience locale
    }
  }

  /**
   * Arrête le heartbeat.
   */
  static stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log(`[TelemetryService] Heartbeat arrêté.`);
    }
  }
}
