"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { TenantOverrides } from '@/modules/system';
import { BUTTON_RADIUS_PRESETS, LAYOUT_OPTIONS } from './overrideConstants';
import { whiteLabelInstanceConfig } from '@/config/instance';

interface UiOverridesSectionProps {
  form: TenantOverrides;
  onUpdateUI: (key: keyof NonNullable<TenantOverrides['ui']>, value: unknown) => void;
}

export function UiOverridesSection({ form, onUpdateUI }: UiOverridesSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Interface
      </p>

      {/* Button radius */}
      <div>
        <label className="text-[9px] font-black text-secondary uppercase tracking-widest block mb-2">
          Rayon des boutons
        </label>
        <div className="grid grid-cols-4 gap-2">
          {BUTTON_RADIUS_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => onUpdateUI('buttonRadius', p.value)}
              className={cn(
                'py-2 text-[9px] font-black uppercase tracking-wider border transition-all',
                form.ui?.buttonRadius === p.value
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-bg-primary/30 border-border-subtle text-secondary hover:border-border-default'
              )}
              style={{ borderRadius: p.value === '9999px' ? '999px' : '8px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout type */}
      <div>
        <label className="text-[9px] font-black text-secondary uppercase tracking-widest block mb-2">
          Layout
        </label>
        <div className="flex flex-wrap gap-2">
          {LAYOUT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onUpdateUI('layoutType', o.value)}
              className={cn(
                'px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all',
                form.ui?.layoutType === o.value
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-bg-primary/30 border-border-subtle text-secondary hover:border-border-default'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary color */}
      <div>
        <label className="text-[9px] font-black text-secondary uppercase tracking-widest block mb-2">
          Couleur primaire
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.ui?.primaryColor ?? whiteLabelInstanceConfig.primaryColor}
            onChange={e => onUpdateUI('primaryColor', e.target.value)}
            className="w-10 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={form.ui?.primaryColor ?? ''}
            placeholder="#6366f1"
            onChange={e => onUpdateUI('primaryColor', e.target.value)}
            className="flex-1 bg-bg-primary/50 border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-mono text-muted focus:outline-none focus:border-border-default"
          />
        </div>
      </div>

      {/* Font scale */}
      <div>
        <label className="text-[9px] font-black text-secondary uppercase tracking-widest block mb-2">
          Échelle de police — {form.ui?.fontScale ?? 1}×
        </label>
        <input
          type="range" min={0.75} max={1.5} step={0.05}
          value={form.ui?.fontScale ?? 1}
          onChange={e => onUpdateUI('fontScale', parseFloat(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>
    </section>
  );
}
