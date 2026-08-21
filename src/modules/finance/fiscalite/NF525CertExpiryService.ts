/**
 * MCC-C5 — Veille expiration certification NF525.
 *
 * Le certificat NF525 d'un logiciel de caisse est délivré par un organisme
 * accrédité (INFOCERT, BUREAU VERITAS…) et a une durée de validité (généralement
 * 3 ans). Après expiration, le logiciel n'est plus certifié et l'établissement
 * s'expose à un redressement fiscal (amende 7 500 € par établissement non conforme).
 *
 * Ce service (MCC niveau flotte) surveille les certifications de toutes les instances
 * déployées et alerte 90 jours avant expiration.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-C5.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const ALERT_DAYS_BEFORE = 90;

export interface NF525CertRecord {
  tenantId: string;
  softwareVersion: string;
  certNumber: string;
  certBody: string;
  issuedAt: number;
  expiresAt: number;
  renewedAt?: number;
}

export interface CertExpiryAlert {
  tenantId: string;
  certNumber: string;
  expiresAt: number;
  daysUntilExpiry: number;
  severity: 'warning' | 'critical' | 'expired';
}

export class NF525CertExpiryService {
  private static certPath(tenantId: string): string {
    return `tenants/${tenantId}/nf525_cert`;
  }

  static async setCert(tenantId: string, cert: Omit<NF525CertRecord, 'tenantId'>): Promise<void> {
    await Nexus.adapter.set(this.certPath(tenantId), { ...cert, tenantId });
  }

  static classifyExpiry(expiresAt: number, now: number): CertExpiryAlert['severity'] | null {
    const daysLeft = (expiresAt - now) / 86400_000;
    if (daysLeft < 0) return 'expired';
    if (daysLeft < 30) return 'critical';
    if (daysLeft < ALERT_DAYS_BEFORE) return 'warning';
    return null;
  }

  static async scanFleet(now?: number): Promise<CertExpiryAlert[]> {
    const ts = now ?? Date.now();
    const allCerts = await Nexus.adapter.query<NF525CertRecord>('nf525_certs_fleet');
    const alerts: CertExpiryAlert[] = [];

    for (const cert of allCerts) {
      const severity = this.classifyExpiry(cert.expiresAt, ts);
      if (!severity) continue;

      const daysUntilExpiry = Math.floor((cert.expiresAt - ts) / 86400_000);
      const alert: CertExpiryAlert = {
        tenantId: cert.tenantId,
        certNumber: cert.certNumber,
        expiresAt: cert.expiresAt,
        daysUntilExpiry,
        severity,
      };

      await NexusEventBus.emit('compliance.nf525_cert_expiry_alert', {
        v: 1,
        tenantId: cert.tenantId,
        certNumber: cert.certNumber,
        daysUntilExpiry,
        severity,
        detectedAt: ts,
      }).catch(() => null);

      alerts.push(alert);
    }

    return alerts;
  }
}
