"use client";

import React, { useEffect, useState } from 'react';
import { PackageOpen, ToggleLeft, ToggleRight, Loader2, ServerCog, Store } from 'lucide-react';
import { useFleet } from '@/shared/contexts/FleetContext';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

interface CatalogItem {
  name: string;
  basePrice: number;
  category?: string;
}

interface TenantPluginState {
  tenantId: string;
  activePlugins: Record<string, { active: boolean, activatedAt?: string }>;
}

export function PluginEnginePanel() {
  const { instances } = useFleet();
  const [pluginsByTenant, setPluginsByTenant] = useState<TenantPluginState[]>([]);
  const [dynamicCatalog, setDynamicCatalog] = useState<Record<string, CatalogItem>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let latestCatalog = {};
      const results = await Promise.allSettled(
        instances.map(async inst => {
          const res = await authedFetch(`/api/admin/fleet/plugins?tenantId=${encodeURIComponent(inst.id)}`);
          return res.ok ? (await res.json()) : null;
        })
      );
      
      const parsedResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => {
          latestCatalog = { ...latestCatalog, ...r.value.catalog };
          return { tenantId: r.value.tenantId, activePlugins: r.value.activePlugins };
        });

      setDynamicCatalog(latestCatalog);
      setPluginsByTenant(parsedResults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instances.length > 0) void load();
  }, [instances]);

  const togglePlugin = async (tenantId: string, pluginId: string, currentlyActive: boolean) => {
    setActionLoading(`${tenantId}-${pluginId}`);
    try {
      const method = currentlyActive ? 'DELETE' : 'POST';
      const res = await authedFetch('/api/admin/fleet/plugins', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, pluginId })
      });

      if (!res.ok) throw new Error('API Error');
      
      toast.success(`Plugin ${currentlyActive ? 'désactivé' : 'activé'} avec succès`);
      await load(); // Refresh data
    } catch (e) {
      toast.error('Erreur lors du changement de statut');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <ServerCog className="w-5 h-5 text-brand" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Moteur de Plugins (Marketplace)</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : instances.length === 0 ? (
        <p className="text-xs text-secondary text-center py-6">Aucun tenant trouvé.</p>
      ) : (
        <div className="space-y-6">
          {pluginsByTenant.map(tenant => (
            <div key={tenant.tenantId} className="border border-focus/10 rounded-xl overflow-hidden">
              <div className="bg-surface-card border-b border-focus/10 p-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-brand" />
                <span className="text-xs font-bold">{tenant.tenantId}</span>
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-background/50">
                {Object.entries(dynamicCatalog).map(([pluginId, info]) => {
                  const isActive = tenant.activePlugins[pluginId]?.active === true;
                  const isActionLoading = actionLoading === `${tenant.tenantId}-${pluginId}`;
                  
                  return (
                    <div key={pluginId} className="flex items-center justify-between p-3 bg-surface-card border border-border-subtle rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-card border border-border-subtle text-secondary'}`}>
                          <PackageOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{info.name}</div>
                          <div className="text-[10px] text-secondary font-mono">+{info.basePrice}€/mois</div>
                        </div>
                      </div>
                      
                      <button 
                        disabled={isActionLoading}
                        onClick={() => togglePlugin(tenant.tenantId, pluginId, isActive)}
                        className="p-1 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        ) : isActive ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-secondary" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
