"use client";

import React from 'react';
import { Bug } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { TenantOverrides } from '@/modules/system';

interface DebugModeSectionProps {
  form: TenantOverrides;
  current: TenantOverrides;
  onToggleDebug: () => void;
  onSetDebugLevel: (level: 'info' | 'verbose' | 'trace') => void;
  onRemoveDebug: () => void;
}

export function DebugModeSection({
  form,
  current,
  onToggleDebug,
  onSetDebugLevel,
  onRemoveDebug,
}: DebugModeSectionProps) {
  return (
    <section className="p-4 bg-action-primary/5 border border-action-primary/20 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-action-primary" />
          <span className="text-chip-label text-action-primary">Debug Mode</span>
        </div>
        <button
          role="switch"
          aria-checked={!!form.debug?.enabled}
          aria-label="Activer mode debug"
          onClick={onToggleDebug}
          className={cn(
            'w-10 h-5 rounded-full border transition-all relative',
            form.debug?.enabled
              ? 'bg-action-primary border-amber-400'
              : 'bg-bg-primary/50 border-border-subtle'
          )}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            form.debug?.enabled ? 'left-5' : 'left-0.5'
          )} />
        </button>
      </div>

      {form.debug?.enabled && (
        <div className="flex gap-2">
          {(['info', 'verbose', 'trace'] as const).map(l => (
            <button
              key={l}
              aria-label={`Niveau debug ${l}`}
              onClick={() => onSetDebugLevel(l)}
              className={cn(
                'flex-1 py-1.5 text-nano font-black uppercase tracking-wider rounded-lg border transition-all',
                form.debug?.level === l
                  ? 'bg-action-primary/20 border-action-primary/50 text-amber-300'
                  : 'bg-bg-primary/30 border-border-subtle text-secondary hover:border-border-default'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {current.debug?.enabled && (
        <button
          onClick={onRemoveDebug}
          className="text-nano font-black uppercase tracking-wider text-action-primary/60 hover:text-action-primary transition-colors"
        >
          Retirer le mode debug
        </button>
      )}
    </section>
  );
}
