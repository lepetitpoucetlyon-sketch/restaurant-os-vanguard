"use client";

import { Settings2, RefreshCw, PowerOff, Zap, Loader2 } from 'lucide-react';
import { ConnectorStatusBadge } from './ConnectorStatusBadge';
import { useConnector } from '@/shared/hooks/useConnector';
import type { ConnectorEntry } from '../hooks/useIntegrations';

interface Props {
  entry: ConnectorEntry;
  isLoading: boolean;
  onConfigure: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onSync: () => void;
}

export function ConnectorCard({ entry, isLoading, onConfigure, onActivate, onDeactivate, onSync }: Props) {
  const { manifest, state } = entry;
  const { isActive, canConfigure, canManage } = useConnector(manifest.id, state);

  const status = state?.status ?? null;
  const isDisabled = status === 'disabled' || !state;
  const isPending = status === 'pending_config';
  const isError = status === 'error';

  return (
    <div className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
      isActive ? 'border-status-success/40 bg-status-success/5' :
      isError  ? 'border-status-danger/40 bg-status-danger/5'  :
      isPending ? 'border-yellow-500/40 bg-yellow-500/5'       :
      'border-border bg-surface-sidebar'
    }`}>
      {/* Badge premium */}
      {manifest.isPremium && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-500 uppercase tracking-wide">
          Pro
        </span>
      )}

      {/* Logo + nom */}
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{manifest.logo}</span>
        <div className="min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{manifest.displayName}</p>
          <p className="text-xs text-text-muted capitalize mt-0.5">{manifest.category.replace('-', ' ')}</p>
        </div>
      </div>

      {/* Statut */}
      <div className="flex items-center justify-between">
        <ConnectorStatusBadge status={status} />
        {state?.lastSyncAt && (
          <span className="text-[10px] text-text-muted">
            Sync {new Date(state.lastSyncAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Message d'erreur */}
      {isError && state?.errorMessage && (
        <p className="text-xs text-status-danger bg-status-danger/10 px-2 py-1.5 rounded-lg truncate" title={state.errorMessage}>
          {state.errorMessage}
        </p>
      )}

      {/* Actions */}
      {canConfigure && (
        <div className="flex gap-2 mt-1">
          {isDisabled ? (
            <button
              onClick={onActivate}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-surface-base hover:border-brand-primary hover:text-brand-primary disabled:opacity-40 transition-colors"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Activer
            </button>
          ) : (
            <>
              {(isPending || isError) && manifest.authType !== 'none' && (
                <button
                  onClick={onConfigure}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-40 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3 h-3" />}
                  Configurer
                </button>
              )}
              {isActive && canManage && (
                <button
                  onClick={onSync}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-surface-base disabled:opacity-40 transition-colors"
                  title="Synchroniser maintenant"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </button>
              )}
              {isActive && (
                <button
                  onClick={onConfigure}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-surface-base disabled:opacity-40 transition-colors"
                  title="Reconfigurer"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3 h-3" />}
                </button>
              )}
              <button
                onClick={onDeactivate}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border text-text-muted hover:border-status-danger/50 hover:text-status-danger disabled:opacity-40 transition-colors"
                title="Désactiver"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PowerOff className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Vue lecture seule pour les non-directeurs */}
      {!canConfigure && (
        <p className="text-xs text-text-muted italic">
          Configuration réservée au directeur
        </p>
      )}
    </div>
  );
}
