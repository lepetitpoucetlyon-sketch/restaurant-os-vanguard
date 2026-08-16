'use client';

import React from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { NonConformity, TYPE_LABELS } from '../nonConformityTypes';
import { NCStatusBadge } from '../NCStatusBadge';

interface NCListItemProps {
  nc: NonConformity;
  isExpanded: boolean;
  resolvingId: string | null;
  resolutionNote: string;
  onToggleExpand: () => void;
  onStartResolve: () => void;
  onCancelResolve: () => void;
  onChangeResolutionNote: (note: string) => void;
  onConfirmResolve: (nc: NonConformity) => void;
}

export function NCListItem({
  nc,
  isExpanded,
  resolvingId,
  resolutionNote,
  onToggleExpand,
  onStartResolve,
  onCancelResolve,
  onChangeResolutionNote,
  onConfirmResolve,
}: NCListItemProps) {
  return (
    <div
      className={`rounded-xl border transition-colors ${
        nc.status === 'open' ? 'border-status-danger/30 bg-status-danger/5' : 'border-border bg-surface-base'
      }`}
    >
      {/* En-tête carte */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <NCStatusBadge status={nc.status} />
          <span className="font-medium text-sm text-text-primary truncate">{TYPE_LABELS[nc.type]}</span>
          <span className="text-xs text-text-muted hidden sm:block">
            {new Date(nc.date).toLocaleDateString('fr-FR')} — {nc.responsible}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
        )}
      </button>

      {/* Détail expandé */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div>
              <p className="text-xs text-text-muted mb-1">Description</p>
              <p className="text-sm text-text-primary">{nc.description}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Action corrective</p>
              <p className="text-sm text-text-primary">{nc.correctiveAction}</p>
            </div>
          </div>

          {nc.photoRef && (
            <div>
              <p className="text-xs text-text-muted mb-1">Photo</p>
              <img
                src={nc.photoRef}
                alt="Photo non-conformité"
                className="max-w-[200px] rounded-lg border border-border object-cover"
              />
            </div>
          )}

          {nc.status === 'resolved' && nc.resolutionNote && (
            <div className="bg-status-success/10 rounded-lg px-3 py-2">
              <p className="text-xs text-status-success font-medium mb-0.5">Note de résolution</p>
              <p className="text-sm text-text-primary">{nc.resolutionNote}</p>
            </div>
          )}

          {nc.status === 'open' && (
            <>
              {resolvingId === nc.id ? (
                <div className="space-y-2">
                  <label className="block text-xs text-text-muted">Note de résolution *</label>
                  <textarea
                    value={resolutionNote}
                    onChange={e => onChangeResolutionNote(e.target.value)}
                    rows={2}
                    placeholder="Décrivez comment le problème a été résolu..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onCancelResolve}
                      className="px-3 py-1.5 rounded-lg border border-border text-text-muted text-xs hover:text-text-primary transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => onConfirmResolve(nc)}
                      className="px-3 py-1.5 rounded-lg bg-status-success text-text-primary text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Marquer résolu
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onStartResolve}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-success/40 text-status-success text-xs font-medium hover:bg-status-success/10 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marquer comme résolu
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
