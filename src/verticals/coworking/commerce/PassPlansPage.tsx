'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { OccupancyAnalyticsService } from '../domain/OccupancyAnalyticsService';
import type { IPassPlan } from '../domain/types';

export function PassPlansPage() {
  const { activeTenantId } = useTenant();
  const [plans, setPlans] = useState<IPassPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    OccupancyAnalyticsService.listActivePassPlans(activeTenantId)
      .then(setPlans)
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Forfaits & Pass</h1>

      {plans.length === 0 && <p className="text-sm text-gray-500">Aucun forfait actif.</p>}

      <div className="space-y-2">
        {plans.map(p => (
          <div key={p.id} className="rounded-lg border p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.memberName}</div>
              <div className="text-xs text-gray-500">
                {p.kind} · expire le {p.expiresAt}
              </div>
            </div>
            <div className="text-sm font-medium">{(p.priceInMicrounits / 1_000_000).toFixed(2)} €</div>
          </div>
        ))}
      </div>
    </div>
  );
}
