'use client';

import React, { useState } from 'react';
import { useToast, Button, SectionCard } from '@/shared/components/ui';
import { getAllSystemTenantIds } from '@/lib/mcc/SystemTenantRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { Palette, ShieldAlert, RotateCcw, Save } from 'lucide-react';

export function MccBrandingOverridePanel() {
  const systemTenantIds = getAllSystemTenantIds();
  const { showToast } = useToast();

  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [overridePrimary, setOverridePrimary] = useState('#C5A059');
  const [overrideName, setOverrideName] = useState('');
  const [overrideLogo, setOverrideLogo] = useState('');
  const [overrideSplashPolicy, setOverrideSplashPolicy] = useState<'always' | 'first-boot' | 'never'>('always');
  const [isSaving, setIsSaving] = useState(false);

  const handleApplyOverride = async () => {
    if (!selectedTenantId) {
      showToast('Veuillez sélectionner un tenant', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const brandPath = `brands/${selectedTenantId}/config/tokens`;
      await Nexus.adapter.set(
        brandPath,
        {
          tenantId: selectedTenantId,
          ...(overrideName ? { brandName: overrideName } : {}),
          primaryColor: overridePrimary,
          ...(overrideLogo ? { logoUrl: overrideLogo } : {}),
          splashPolicy: overrideSplashPolicy,
          mccOverride: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      showToast(`Surcharge MCC appliquée avec succès au tenant ${selectedTenantId}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la surcharge', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetOverride = async () => {
    if (!selectedTenantId) return;
    setIsSaving(true);
    try {
      const brandPath = `brands/${selectedTenantId}/config/tokens`;
      await Nexus.adapter.set(
        brandPath,
        {
          mccOverride: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      showToast(`Surcharge MCC révoquée pour le tenant ${selectedTenantId}`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors du reset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
        <div>
          <span className="font-bold">Console MCC Sovereign Override :</span> Permet aux opérateurs support et directeurs de flotte de surcharger temporairement la charte graphique et le logo d'un restaurant lors d'une migration ou d'un incident.
        </div>
      </div>

      <SectionCard title="Surcharge Charte Graphique Flotte" subtitle="Sélectionnez un restaurant pour forcer ou réinitialiser ses tokens" icon={Palette}>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Sélection du Restaurant (Tenant)
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-card"
            >
              <option value="">-- Choisir un tenant dans la flotte --</option>
              {systemTenantIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {selectedTenantId && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Couleur Primaire Forcée
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={overridePrimary}
                      onChange={(e) => setOverridePrimary(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border-default cursor-pointer"
                    />
                    <input
                      type="text"
                      value={overridePrimary}
                      onChange={(e) => setOverridePrimary(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border-default bg-surface-bg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Nom d'Enseigne Forcé
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Brasserie Royale"
                    value={overrideName}
                    onChange={(e) => setOverrideName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-default bg-surface-bg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  URL du Logo Forcé
                </label>
                <input
                  type="text"
                  placeholder="https://storage.googleapis.com/.../logo.png"
                  value={overrideLogo}
                  onChange={(e) => setOverrideLogo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border-default bg-surface-bg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Politique Splash Screen
                </label>
                <select
                  value={overrideSplashPolicy}
                  onChange={(e) => setOverrideSplashPolicy(e.target.value as typeof overrideSplashPolicy)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-card"
                >
                  <option value="always">Toujours (Cold Boot cinématique)</option>
                  <option value="first-boot">Premier boot de session</option>
                  <option value="never">Désactivé (Démarrage direct)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
                <Button variant="default" size="sm" onClick={handleApplyOverride} disabled={isSaving}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isSaving ? 'Application...' : 'Appliquer la Surcharge MCC'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetOverride} disabled={isSaving}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Rendre la main au gérant (Reset)
                </Button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
