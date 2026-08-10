import { NexusEventBus, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { ChangelogService } from '@/lib/mcc/ChangelogService';

async function handleEscalation(payload: NexusEventPayload<'support.ticket_escalated'>): Promise<void> {
  const { ticketId, tenantId, riskLevel, confidence, draftTitle } = payload;

  logger.warn(`[SupportEscalation] Ticket ${ticketId} escaladé pour tenant ${tenantId} (risk=${riskLevel}, confidence=${confidence})`);

  await ChangelogService.record({
    tenantId,
    action: 'SYSTEM_MAINTENANCE_TRIGGERED',
    key: `supportTickets.${ticketId}.escalation`,
    after: { ticketId, riskLevel, confidence, draftTitle },
    description: `[ESCALATION] ${draftTitle} (Risque: ${riskLevel}, Confiance: ${Math.round(confidence * 100)}%)`,
    appliedBy: 'system:support-escalation',
    scope: 'fleet',
    category: 'MAINTENANCE',
  });
}

let registered = false;

export function registerSupportEscalationHandler(): () => void {
  if (registered) return () => {};
  registered = true;
  return NexusEventBus.on('support.ticket_escalated', handleEscalation, {
    id: 'support-ticket-escalation',
    priority: 'CRITICAL',
  });
}
