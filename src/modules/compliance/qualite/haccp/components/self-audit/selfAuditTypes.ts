import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export type CheckStatus = 'ok' | 'error' | 'warning' | 'pending' | 'checking';

export interface AuditCheck {
  id: string;
  label: string;
  description: string;
  howToFix?: string;
  status: CheckStatus;
  autoCheck: boolean;
  icon: React.ReactNode;
}

export const STATUS_CONFIG: Record<
  CheckStatus,
  { icon: React.ReactNode; badgeClass: string; label: string }
> = {
  ok: {
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4 text-status-success" }),
    badgeClass: 'bg-status-success/10 text-emerald-600 dark:text-status-success border-emerald-500/20',
    label: 'Conforme',
  },
  error: {
    icon: React.createElement(XCircle, { className: "w-4 h-4 text-status-danger" }),
    badgeClass: 'bg-status-danger/10 text-red-600 dark:text-status-danger border-red-500/20',
    label: 'Non conforme',
  },
  warning: {
    icon: React.createElement(AlertCircle, { className: "w-4 h-4 text-action-primary" }),
    badgeClass: 'bg-action-primary/10 text-amber-600 dark:text-action-primary border-action-primary/20',
    label: 'A vérifier',
  },
  pending: {
    icon: React.createElement(AlertCircle, { className: "w-4 h-4 text-text-muted" }),
    badgeClass: 'bg-bg-secondary text-text-muted border-border',
    label: 'Non vérifié',
  },
  checking: {
    icon: React.createElement(RefreshCw, { className: "w-4 h-4 text-accent animate-spin" }),
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
    label: 'Vérification…',
  },
};

export const ARCHITECTURAL_GUARANTEES: ReadonlySet<string> = new Set([
  'sequencing',
  'immutability',
]);
