"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/shared/providers/fleet';
import type { TenantOverrides } from '@/modules/system';
import { TenantSelectorDropdown } from './tenant-override/TenantSelectorDropdown';
import { UiOverridesSection } from './tenant-override/UiOverridesSection';
import { BrandingAccessSection } from './tenant-override/BrandingAccessSection';
import { DebugModeSection } from './tenant-override/DebugModeSection';

export function TenantOverridePanel() {
  const { instances } = useNexusFleet();

  const [selectedId, setSelectedId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [current, setCurrent]  = useState<TenantOverrides>({});
  const [form, setForm]        = useState<TenantOverrides>({});
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult]    = useState<{ success: boolean; msg: string } | null>(null);

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

  const updateBrandCap = (cap: 'mod_brand_basic' | 'mod_brand_plus', value: boolean) => {
    setForm(f => ({
      ...f,
      capabilities: { ...f.capabilities, [cap]: value },
    }));
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
          <p className="text-nano font-bold text-secondary uppercase tracking-tighter">Customisation granulaire par client</p>
        </div>
      </div>

      <TenantSelectorDropdown
        instances={instances}
        selectedId={selectedId}
        dropdownOpen={dropdownOpen}
        onToggleDropdown={() => setDropdownOpen(o => !o)}
        onSelectTenant={id => { setSelectedId(id); setDropdownOpen(false); }}
      />

      {selectedId && (
        <div className="space-y-6">
          <UiOverridesSection form={form} onUpdateUI={updateUI} />

          <BrandingAccessSection
            form={form}
            current={current}
            onUpdateBrandCap={updateBrandCap}
          />

          <DebugModeSection
            form={form}
            current={current}
            onToggleDebug={() => {
              const enabled = !form.debug?.enabled;
              setForm(f => ({ ...f, debug: { enabled, level: f.debug?.level ?? 'info' } }));
            }}
            onSetDebugLevel={level => setForm(f => ({ ...f, debug: { enabled: true, level } }))}
            onRemoveDebug={handleRemoveDebug}
          />

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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-primary/30 border border-border-subtle text-chip-label text-secondary hover:text-muted transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleApply}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-text-primary text-chip-label transition-all disabled:opacity-50"
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
                  'flex items-center gap-2 p-3 rounded-xl border text-chip-label',
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
