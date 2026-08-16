import React from 'react';
import { Shield, XCircle, RefreshCw } from 'lucide-react';
import type { AuditCheck } from './selfAuditTypes';

interface SelfAuditHeaderProps {
  checks: AuditCheck[];
  isRunning: boolean;
  onRefresh: () => void;
}

export function SelfAuditHeader({ checks, isRunning, onRefresh }: SelfAuditHeaderProps) {
  const okCount = checks.filter(c => c.status === 'ok').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const total = checks.length;

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Self-Audit NF525</h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Conformité fiscale caisse enregistreuse
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-3xl font-bold text-text-primary">
            {okCount}
            <span className="text-lg text-text-muted font-normal">/{total}</span>
          </p>
          <p className="text-sm text-text-muted mt-0.5">critères conformes</p>
        </div>
        <div className="flex gap-4">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-status-danger">
              <XCircle className="w-3.5 h-3.5" />
              {errorCount} non conforme{errorCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRunning}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Relancer l'audit
          </button>
        </div>
      </div>
    </div>
  );
}
