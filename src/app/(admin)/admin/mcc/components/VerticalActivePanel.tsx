'use client';

import React, { useEffect, useState } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { VerticalRegistry } from '@/kernel/plugins/VerticalRegistry';

const VERTICAL_META: Record<string, { emoji: string; label: string; color: string }> = {
  restaurant: { emoji: '🍽️', label: 'Restaurant', color: 'text-amber-400' },
  hotel:      { emoji: '🏨', label: 'Hôtel',       color: 'text-blue-400' },
  garage:     { emoji: '🔧', label: 'Garage',       color: 'text-slate-400' },
  clinic:     { emoji: '🏥', label: 'Clinique',     color: 'text-emerald-400' },
  bakery:     { emoji: '🥐', label: 'Boulangerie',  color: 'text-yellow-500' },
  salon:      { emoji: '✂️', label: 'Salon',         color: 'text-pink-400' },
  retail:     { emoji: '🛍️', label: 'Retail',        color: 'text-purple-400' },
  custom:     { emoji: '🏢', label: 'Custom',        color: 'text-muted' },
};

interface VerticalConfig {
  variant: string;
  registeredRoutes: string[];
  registeredAtoms: string[];
  activatedAt: string;
  pluginVersion: string;
}

interface Props { tenantId: string }

export function VerticalActivePanel({ tenantId }: Props) {
  const [config, setConfig] = useState<VerticalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Nexus.adapter.get(`tenants/${tenantId}/vertical-config`)
      .then(data => setConfig(data as VerticalConfig | null))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div className="text-xs text-muted animate-pulse">Chargement vertical…</div>;
  if (!config) return (
    <div className="text-xs text-muted p-3 border border-subtle rounded-xl">
      Aucun vertical actif — ce tenant a été créé avant le câblage VerticalRegistry.
    </div>
  );

  const meta = VERTICAL_META[config.variant] ?? { emoji: '🏢', label: config.variant, color: 'text-muted' };
  const availableVariants = VerticalRegistry.list();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-surface-card border border-subtle rounded-2xl">
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <p className={`text-sm font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</p>
          <p className="text-[10px] text-muted">v{config.pluginVersion} · activé le {new Date(config.activatedAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {config.registeredRoutes.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Routes enregistrées</p>
          <div className="flex flex-wrap gap-2">
            {config.registeredRoutes.map(r => (
              <span key={r} className="text-[10px] font-mono bg-surface-bg border border-subtle rounded px-2 py-1">{r}</span>
            ))}
          </div>
        </div>
      )}

      {config.registeredAtoms.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Atoms Jotai actifs</p>
          <div className="flex flex-wrap gap-2">
            {config.registeredAtoms.map(a => (
              <span key={a} className="text-[10px] font-mono bg-surface-bg border border-subtle rounded px-2 py-1">{a}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Verticals disponibles</p>
        <div className="flex gap-2 flex-wrap">
          {availableVariants.map(v => {
            const m = VERTICAL_META[v] ?? { emoji: '🏢', label: v, color: 'text-muted' };
            const active = v === config.variant;
            return (
              <span key={v} className={`text-[10px] px-3 py-1 rounded-full border font-bold ${active ? 'border-focus/50 text-brand bg-action-primary/10' : 'border-subtle text-muted'}`}>
                {m.emoji} {m.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
