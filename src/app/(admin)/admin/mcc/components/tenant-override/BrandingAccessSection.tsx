"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { TenantOverrides } from '@/modules/system';

interface BrandingAccessSectionProps {
  form: TenantOverrides;
  current: TenantOverrides;
  onUpdateBrandCap: (cap: 'mod_brand_basic' | 'mod_brand_plus', value: boolean) => void;
}

export function BrandingAccessSection({
  form,
  current,
  onUpdateBrandCap,
}: BrandingAccessSectionProps) {
  return (
    <section className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl space-y-4">
      <p className="text-chip-label text-violet-400 flex items-center gap-2">
        <Palette className="w-3.5 h-3.5" /> Accès Branding
      </p>

      {/* mod_brand_basic */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted">mod_brand_basic</p>
          <p className="text-[9px] text-secondary mt-0.5">Logo · couleurs · favicon · splash</p>
        </div>
        <button
          onClick={() => onUpdateBrandCap('mod_brand_basic', !(form.capabilities?.['mod_brand_basic'] !== false))}
          className={cn(
            'w-10 h-5 rounded-full border transition-all relative shrink-0',
            form.capabilities?.['mod_brand_basic'] !== false
              ? 'bg-violet-500 border-violet-400'
              : 'bg-bg-primary/50 border-border-subtle'
          )}
          title={form.capabilities?.['mod_brand_basic'] !== false ? 'Désactiver' : 'Activer'}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            form.capabilities?.['mod_brand_basic'] !== false ? 'left-5' : 'left-0.5'
          )} />
        </button>
      </div>

      {/* mod_brand_plus */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted">mod_brand_plus</p>
          <p className="text-[9px] text-secondary mt-0.5">Configurateur avancé · AI · presets · polices</p>
        </div>
        <button
          onClick={() => onUpdateBrandCap('mod_brand_plus', !(form.capabilities?.['mod_brand_plus'] === true))}
          className={cn(
            'w-10 h-5 rounded-full border transition-all relative shrink-0',
            form.capabilities?.['mod_brand_plus'] === true
              ? 'bg-violet-500 border-violet-400'
              : 'bg-bg-primary/50 border-border-subtle'
          )}
          title={form.capabilities?.['mod_brand_plus'] === true ? 'Désactiver' : 'Activer'}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            form.capabilities?.['mod_brand_plus'] === true ? 'left-5' : 'left-0.5'
          )} />
        </button>
      </div>

      {/* Indicateur d'état actuel (Firestore) */}
      {(current.capabilities?.['mod_brand_basic'] !== undefined || current.capabilities?.['mod_brand_plus'] !== undefined) && (
        <p className="text-[9px] text-secondary/60 border-t border-violet-500/10 pt-2">
          État actuel Firestore —{' '}
          basic: <span className="font-mono">{String(current.capabilities?.['mod_brand_basic'] !== false)}</span>
          {' · '}
          plus: <span className="font-mono">{String(current.capabilities?.['mod_brand_plus'] === true)}</span>
        </p>
      )}
    </section>
  );
}
