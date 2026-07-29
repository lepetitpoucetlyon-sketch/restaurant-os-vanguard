"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Bug, CheckCircle2, AlertCircle, ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/modules/intelligence/fleet';
import type { TenantOverrides } from '@/domain/schemas/tenant';

const BUTTON_RADIUS_PRESETS = [
  { label: 'Carré',    value: '0px'     },
  { label: 'Doux',     value: '8px'     },
  { label: 'Arrondi',  value: '16px'    },
  { label: 'Pill',     value: '9999px'  },
];

const LAYOUT_OPTIONS = [
  { value: 'default', label: 'Default'  },
  { value: 'kiosk',   label: 'Kiosk'   },
  { value: 'hud',     label: 'HUD'     },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'topbar',  label: 'Topbar'  },
];

export function TenantOverridePanel() {
  const { instances } = useNexusFleet();

  const [selectedId, setSelectedId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [current, setCurrent]  = useState<TenantOverrides>({});
  const [form, setForm]        = useState<TenantOverrides>({});
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult]    = useState<{ success: boolean; msg: string } | null>(null);

  const selectedInstance = instances.find(i => i.id === selectedId);

  const loadOverrides = useCallback(async (tid: string) => {
    try {
      const res  = await authedFetch(`/api/admin/fleet/tenant-override?tenantId=${tid}`);
      const data = await res.json() as { overrides?: TenantOverrides };
      const ov   = data.overrides ?? {};
      setCurrent(ov);
      setForm(ov);
    } catch {
      setCurrent({});
      setForm({});
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadOverrides(selectedId);
  }, [selectedId, loadOverrides]);

  const updateUI = (key: keyof NonNullable<TenantOverrides['ui']>, value: unknown) => {
    setForm(f => ({ ...f, ui: { ...f.ui, [key]: value } }));
  };

  const handleApply = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    setResult(null);
    try {
      const res = await authedFetch('/api/admin/fleet/tenant-override', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tenantIds:   [selectedId],
          overrides:   form,
          description: description || undefined,
        }),
      });
      const data = await res.json() as { success?: boolean };
      if (data.success) {
        setCurrent(form);
        setResult({ success: true, msg: 'Override appliqué' });
        await loadOverrides(selectedId);
      } else {
        setResult({ success: false, msg: 'Échec de l\'application' });
      }
    } catch {
      setResult({ success: false, msg: 'Erreur réseau' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(current);
    setResult(null);
  };

  const handleRemoveDebug = async () => {
    if (!selectedId) return;
    await authedFetch('/api/admin/fleet/tenant-override', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tenantId: selectedId, key: 'debug' }),
    });
    await loadOverrides(selectedId);
  };

  return (
    <div className="p-6 bg-surface-card border border-border-subtle rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
          <Sliders className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Tenant Override</h3>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Customisation granulaire par client</p>
        </div>
      </div>

      {/* Tenant selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="w-full flex items-center justify-between p-3 bg-bg-primary/50 border border-border-subtle rounded-xl text-sm font-medium text-muted hover:border-border-default transition-all"
        >
          <span className="truncate">
            {selectedInstance ? `${selectedInstance.name ?? selectedInstance.id}` : 'Sélectionner un tenant...'}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-secondary transition-transform', dropdownOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute z-20 top-full mt-1 w-full bg-surface-bg border border-border-subtle rounded-xl overflow-hidden shadow-xl"
            >
              {instances.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { setSelectedId(inst.id); setDropdownOpen(false); }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-surface-card transition-colors',
                    inst.id === selectedId ? 'text-violet-400 bg-violet-500/10' : 'text-muted'
                  )}
                >
                  {inst.name ?? inst.id}
                  <span className="ml-2 text-secondary text-[10px]">{inst.id}</span>
                </button>
              ))}
              {instances.length === 0 && (
                <p className="px-4 py-3 text-xs text-secondary">Aucun tenant dans la flotte</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedId && (
        <div className="space-y-6">
          {/* UI Overrides */}
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
                    onClick={() => updateUI('buttonRadius', p.value)}
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
                    onClick={() => updateUI('layoutType', o.value)}
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
                  value={form.ui?.primaryColor ?? '#6366f1'}
                  onChange={e => updateUI('primaryColor', e.target.value)}
                  className="w-10 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={form.ui?.primaryColor ?? ''}
                  placeholder="#6366f1"
                  onChange={e => updateUI('primaryColor', e.target.value)}
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
                onChange={e => updateUI('fontScale', parseFloat(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
          </section>

          {/* Debug mode */}
          <section className="p-4 bg-action-primary/5 border border-action-primary/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-action-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-action-primary">Debug Mode</span>
              </div>
              <button
                onClick={() => {
                  const enabled = !form.debug?.enabled;
                  setForm(f => ({ ...f, debug: { enabled, level: f.debug?.level ?? 'info' } }));
                }}
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
                    onClick={() => setForm(f => ({ ...f, debug: { enabled: true, level: l } }))}
                    className={cn(
                      'flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all',
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
                onClick={handleRemoveDebug}
                className="text-[9px] font-black uppercase tracking-wider text-action-primary/60 hover:text-action-primary transition-colors"
              >
                Retirer le mode debug
              </button>
            )}
          </section>

          {/* Description */}
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description du changement (optionnel)"
            className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-xs text-muted focus:outline-none focus:border-border-default"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-primary/30 border border-border-subtle text-[10px] font-black uppercase tracking-widest text-secondary hover:text-muted transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleApply}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-text-primary text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isSaving ? 'Application...' : 'Appliquer l\'override'}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest',
                  result.success
                    ? 'bg-status-success/10 text-status-success border-emerald-500/20'
                    : 'bg-status-danger/10 text-status-danger border-red-500/20'
                )}
              >
                {result.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {result.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
