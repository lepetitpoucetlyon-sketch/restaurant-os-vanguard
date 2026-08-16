import type { CartItem } from '@/modules/ops';

export interface SUPPORTEvents {
  'support.ticket_submitted': {
    v: 1;
    isSimulation?: boolean;
    ticketId: string;
    tenantId: string;
    description: string;
    screenshotUrl?: string;
    submittedBy: string;
  };

  'support.ticket_escalated': {
    v: 1;
    isSimulation?: boolean;
    ticketId: string;
    tenantId: string;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
    draftTitle: string;
  };
}
