import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import type { EmployeeDocument } from '@/modules/human';
import type { License } from '@nexus/contracts';
import { toError } from "@/lib/toError";

interface RegisterDoc {
  id: string;
  title: string;
  status: string;
  expiresAt?: string;
  nextReview?: string;
  type?: string;
}

type CalendarEventType = 'audit' | 'renewal' | 'inspection' | 'training';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function inferEventType(item: { type?: string; name?: string }): CalendarEventType {
  const t = (item.type ?? item.name ?? '').toLowerCase();
  if (t.includes('audit') || t.includes('inspection')) return 'audit';
  if (t.includes('training') || t.includes('formation')) return 'training';
  if (t.includes('inspection') || t.includes('contrôle')) return 'inspection';
  return 'renewal';
}

export class ComplianceWatcherService {
  static async scanExpirations(tenantId: string): Promise<{
    expired: number;
    upcoming: number;
  }> {
    let expired = 0;
    let upcoming = 0;

    try {
      const [docs, licenses, registerDocs] = await Promise.all([
        Nexus.adapter.query<EmployeeDocument>(`tenants/${tenantId}/employeeDocuments`),
        Nexus.adapter.query<License>(`tenants/${tenantId}/licenses`),
        Nexus.adapter.query<RegisterDoc>(`tenants/${tenantId}/documents`),
      ]);

      for (const doc of docs) {
        if (!doc.expiresAt) continue;
        const days = daysUntil(doc.expiresAt);

        if (days < 0) {
          expired++;
          await NexusEventBus.emitDurable('cert.expired', {
            v: 1,
            tenantId,
            certId: doc.id,
            certType: doc.type ?? 'employee_document',
            entityName: doc.name ?? doc.id,
            expiredAt: doc.expiresAt,
          });
        } else if (days <= 30) {
          upcoming++;
          await NexusEventBus.emitDurable('compliance.calendar', {
            v: 1,
            tenantId,
            eventType: inferEventType(doc),
            title: `Renouvellement : ${doc.name ?? doc.type ?? doc.id}`,
            dueDate: doc.expiresAt,
            daysUntilDue: days,
          });
        }
      }

      for (const lic of licenses) {
        if (!lic.expiresAt) continue;
        const days = daysUntil(lic.expiresAt);

        if (days < 0) {
          expired++;
          await NexusEventBus.emitDurable('cert.expired', {
            v: 1,
            tenantId,
            certId: lic.id,
            certType: lic.type ?? 'license',
            entityName: lic.name ?? lic.id,
            expiredAt: lic.expiresAt,
          });
        } else if (days <= 30) {
          upcoming++;
          await NexusEventBus.emitDurable('compliance.calendar', {
            v: 1,
            tenantId,
            eventType: 'renewal',
            title: `Renouvellement licence : ${lic.name ?? lic.id}`,
            dueDate: lic.expiresAt,
            daysUntilDue: days,
          });
        }
      }

      for (const reg of registerDocs) {
        const expiryDate = reg.expiresAt ?? reg.nextReview;
        if (!expiryDate) continue;
        const days = daysUntil(expiryDate);

        if (days < 0) {
          expired++;
          await NexusEventBus.emitDurable('cert.expired', {
            v: 1,
            tenantId,
            certId: reg.id,
            certType: reg.type ?? 'register_document',
            entityName: reg.title ?? reg.id,
            expiredAt: expiryDate,
          });
        } else if (days <= 30) {
          upcoming++;
          await NexusEventBus.emitDurable('compliance.calendar', {
            v: 1,
            tenantId,
            eventType: inferEventType(reg),
            title: `Échéance : ${reg.title ?? reg.id}`,
            dueDate: expiryDate,
            daysUntilDue: days,
          });
        }
      }

      logger.info(`[ComplianceWatcher] Scan tenant ${tenantId}: ${expired} expired, ${upcoming} upcoming`);
    } catch (err) {
      logger.error('[ComplianceWatcher] Scan failed', toError(err).message);
    }

    return { expired, upcoming };
  }
}
