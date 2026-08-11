"use client";

import React, { useEffect, useState } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';

interface BillingInfo {
  tenantId:   string;
  name:       string;
  plan:       string;
  status:     string;
  nextBillingDate: string | null;
  stripeCustomerId: string | null;
  activePlugins: string[];
  monthlyExtraCost: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE:          { label: 'Actif',         color: 'text-status-success', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  past_due:        { label: 'En retard',     color: 'text-yellow-400',     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  past_due_grace:  { label: 'Relancé',       color: 'text-orange-400',     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  suspended:       { label: 'Suspendu',      color: 'text-status-error',   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  LOCKED:          { label: 'Verrouillé',    color: 'text-status-error',   icon: <Lock className="w-3.5 h-3.5" /> },
  cancelled:       { label: 'Résilié',       color: 'text-secondary',      icon: <Lock className="w-3.5 h-3.5" /> },
};

export function TenantBillingPanel() {
  const { instances } = useFleet();
  const [billingData, setBillingData] = useState<BillingInfo[]>([]);
  const [loading, setLoading]         = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        instances.map(async inst => {
          const res = await fetch(
            `/api/admin/fleet/tenant-billing?tenantId=${encodeURIComponent(inst.id)}`,
          );
          return res.ok ? (await res.json() as BillingInfo) : null;
        }),
      );
      setBillingData(
        results
          .filter((r): r is PromiseFulfilledResult<BillingInfo> => r.status === 'fulfilled' && r.value !== null)
          .map(r => r.value),
      );
    } finally {
      setLoading(false);
    }
  };

  const instanceIds = instances.map(i => i.id).join(',');
  useEffect(() => { void load(); }, [instanceIds]);  

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Abonnements Flotte</h3>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-secondary hover:text-text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-card rounded-xl animate-pulse" />)}</div>
      ) : billingData.length === 0 ? (
        <p className="text-xs text-secondary text-center py-6">Aucun tenant trouvé.</p>
      ) : (
        <div className="space-y-2">
          {billingData.map(b => {
            const st = STATUS_CONFIG[b.status] ?? { label: b.status, color: 'text-secondary', icon: null };
            return (
              <div key={b.tenantId} className="flex items-center justify-between p-3 bg-surface-card border border-border-subtle rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{b.name}</p>
                  <p className="text-[10px] text-secondary font-mono">{b.tenantId}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-secondary font-bold uppercase tracking-widest">{b.plan}</span>
                  <span className={`flex items-center gap-1 font-bold ${st.color}`}>
                    {st.icon}{st.label}
                  </span>
                  {b.nextBillingDate && (
                    <span className="flex items-center gap-1 text-secondary">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.nextBillingDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {b.monthlyExtraCost > 0 && (
                    <span className="px-2 py-0.5 bg-brand/10 text-brand rounded font-black text-[10px]">
                      +{b.monthlyExtraCost.toFixed(2)}€/m (Plugins)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
