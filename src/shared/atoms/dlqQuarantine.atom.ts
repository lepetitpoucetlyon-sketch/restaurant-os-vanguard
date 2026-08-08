import { atom } from 'jotai';

export interface DLQQuarantineEntry {
  tenantId: string;
  eventName: string;
  handlerId: string;
  attempts: number;
  lastError: string;
  quarantinedAt: number;
}

/**
 * Atome Jotai contenant la liste des events en quarantaine DLQ.
 * Alimenté par le listener `mcc.dlq_quarantine` dans NexusSyncService
 * ou directement par le hook `useDLQQuarantine`.
 */
export const dlqQuarantineEntriesAtom = atom<DLQQuarantineEntry[]>([]);
