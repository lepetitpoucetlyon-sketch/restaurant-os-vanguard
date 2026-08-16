import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AuditCheck,
  STATUS_CONFIG,
  ARCHITECTURAL_GUARANTEES,
} from './selfAuditTypes';

interface SelfAuditChecklistProps {
  checks: AuditCheck[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onToggleManualCheck: (id: string) => void;
}

export function SelfAuditChecklist({
  checks,
  expandedId,
  onToggleExpand,
  onToggleManualCheck,
}: SelfAuditChecklistProps) {
  return (
    <div className="space-y-3">
      {checks.map(check => {
        const isExpanded = expandedId === check.id;
        const sc = STATUS_CONFIG[check.status];

        return (
          <div
            key={check.id}
            className="rounded-2xl border border-border bg-bg-secondary overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-primary/40 transition-colors"
              onClick={() => onToggleExpand(check.id)}
            >
              <span className="text-text-muted shrink-0">{check.icon}</span>
              <span className="flex-1 text-sm font-medium text-text-primary">{check.label}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.badgeClass}`}
              >
                {sc.label}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {check.description}
                </p>

                {check.howToFix && check.status !== 'ok' && (
                  <div className="rounded-xl bg-action-primary/5 border border-action-primary/20 p-3">
                    <p className="text-xs text-amber-600 dark:text-action-primary font-medium">
                      Correction : {check.howToFix}
                    </p>
                  </div>
                )}

                {!check.autoCheck && (
                  <button
                    onClick={() => onToggleManualCheck(check.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                      check.status === 'ok'
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-status-success hover:bg-status-success/10'
                        : 'border-border text-text-muted hover:bg-bg-primary'
                    }`}
                  >
                    {check.status === 'ok'
                      ? 'Marquer comme non vérifié'
                      : 'Marquer comme conforme (vérification manuelle)'}
                  </button>
                )}

                {ARCHITECTURAL_GUARANTEES.has(check.id) && (
                  <p className="text-xs text-text-muted italic">
                    Garanti architecturalement par SovereignGuard — pas d'action requise.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
