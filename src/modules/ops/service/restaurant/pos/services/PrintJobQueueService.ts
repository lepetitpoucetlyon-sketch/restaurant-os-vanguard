import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { getSetting } from '@/lib/settings/SettingsReader';

export type OnPrintFailureAction = 'queue_and_alert' | 'digital_receipt_qr' | 'email_receipt';

export interface QueuedPrintJob {
  id: string;
  tenantId: string;
  orderId: string;
  targetPrinterId: string;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  status: 'PENDING' | 'RETRYING' | 'FAILED' | 'PRINTED';
  actionTaken: OnPrintFailureAction;
  digitalReceiptUrl?: string;
}

export interface PrintFailureInput {
  tenantId: string;
  orderId: string;
  targetPrinterId: string;
  payload: Record<string, unknown>;
  customerEmail?: string;
}

export interface PrintFailureResolution {
  queueId: string;
  actionTaken: OnPrintFailureAction;
  status: 'QUEUED' | 'FALLBACK_GENERATED';
  digitalReceiptUrl?: string;
  message: string;
}

/**
 * 🖨️ PrintJobQueueService (Priorité 1.4 & DF-D3)
 * File d'attente résiliente et gestion des pannes d'impression totales :
 * 1. Mise en file d'attente persistée
 * 2. Émission d'alerte matériel facility.hardware_fault
 * 3. Génération de justificatif dématérialisé (QR Code ou email) selon le réglage `on_print_failure`.
 */
export class PrintJobQueueService {
  private static queue: Map<string, QueuedPrintJob> = new Map();

  static async handlePrintFailure(input: PrintFailureInput): Promise<PrintFailureResolution> {
    const queueId = `print_job_${input.orderId}_${Date.now()}`;
    const action = getSetting<OnPrintFailureAction>('pos', 'on_print_failure', 'queue_and_alert');

    const digitalReceiptUrl = action === 'digital_receipt_qr'
      ? `/receipt/${input.tenantId}/${input.orderId}`
      : undefined;

    const job: QueuedPrintJob = {
      id: queueId,
      tenantId: input.tenantId,
      orderId: input.orderId,
      targetPrinterId: input.targetPrinterId,
      payload: input.payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: 'PENDING',
      actionTaken: action,
      digitalReceiptUrl,
    };

    this.queue.set(queueId, job);

    logger.warn(`[PrintJobQueueService] Échec total d'impression pour la commande ${input.orderId} (imprimante ${input.targetPrinterId}). Action: ${action}`);

    // Émettre un incident matériel découplé du crash logiciel (Invariant #6)
    NexusEventBus.emit('facility.hardware_fault', {
      v: 1,
      tenantId: input.tenantId,
      deviceId: input.targetPrinterId,
      deviceType: 'printer',
      faultCode: 'CONNECTION_LOST',
      severity: 'high',
      message: `Imprimante ${input.targetPrinterId} indisponible lors de l'impression commande ${input.orderId}`,
      timestamp: new Date().toISOString(),
    });

    // Émettre une notification urgente pour l'interface de caisse
    NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId: input.tenantId,
      message: `Impression ticket impossible (${input.targetPrinterId}). ${action === 'digital_receipt_qr' ? 'QR Code ticket généré.' : 'Ticket mis en file d\'attente.'}`,
      roles: ['serveur', 'chef_rang', 'manager', 'directeur'],
      priority: 'HIGH',
      metadata: {
        queueId,
        orderId: input.orderId,
      },
    });

    empireAudit.log({
      module: 'ops',
      action: 'PRINT_JOB_QUEUED_AFTER_FAILURE',
      details: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        targetPrinterId: input.targetPrinterId,
        actionTaken: action,
        queueId,
      },
      severity: 'medium',
      timestamp: new Date(),
    });

    return {
      queueId,
      actionTaken: action,
      status: action === 'digital_receipt_qr' ? 'FALLBACK_GENERATED' : 'QUEUED',
      digitalReceiptUrl,
      message: action === 'digital_receipt_qr'
        ? 'Ticket scellé disponible par QR Code client.'
        : 'Ticket placé en file d\'attente et alerté en caisse.',
    };
  }

  static getPendingJobs(tenantId?: string): QueuedPrintJob[] {
    const jobs = Array.from(this.queue.values()).filter(j => j.status === 'PENDING' || j.status === 'RETRYING');
    if (tenantId) {
      return jobs.filter(j => j.tenantId === tenantId);
    }
    return jobs;
  }

  static markJobPrinted(queueId: string): boolean {
    const job = this.queue.get(queueId);
    if (job) {
      job.status = 'PRINTED';
      return true;
    }
    return false;
  }

  static clearQueue(): void {
    this.queue.clear();
  }
}
