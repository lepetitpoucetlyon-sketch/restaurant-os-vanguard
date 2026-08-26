"use client";

import type { ConnectorState } from '@/shared/connector-manifest';

const CONFIG: Record<NonNullable<ConnectorState['status']>, { label: string; cls: string }> = {
  active:         { label: 'Actif',           cls: 'bg-status-success/15 text-status-success' },
  pending_config: { label: 'À configurer',    cls: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  error:          { label: 'Erreur',          cls: 'bg-status-danger/15 text-status-danger' },
  disabled:       { label: 'Désactivé',       cls: 'bg-surface-glass text-text-muted' },
};

export function ConnectorStatusBadge({ status }: { status: ConnectorState['status'] | null }) {
  const cfg = status ? CONFIG[status] : CONFIG.disabled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  );
}
