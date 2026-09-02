'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { FlowerFreshnessService } from '../domain/FlowerFreshnessService';
import type { IFlowerDelivery } from '../domain/types';

export function FlowerDeliveriesPage() {
  const { activeTenantId } = useTenant();
  const [deliveries, setDeliveries] = useState<IFlowerDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    FlowerFreshnessService.listDeliveries(activeTenantId)
      .then(setDeliveries)
      .catch((e) => console.error('[FlowerDeliveriesPage]', e))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Tournées Livraison</h1>

      {deliveries.length === 0 && <p className="text-sm text-gray-500">Aucune livraison en cours.</p>}

      <div className="space-y-2">
        {deliveries.map(d => (
          <div key={d.id} className="rounded-lg border p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{d.recipientName}</div>
              <div className="text-xs text-gray-500">
                {d.recipientAddress} · prévu le {new Date(d.scheduledFor).toLocaleString('fr-FR')}
              </div>
            </div>
            <div className="text-sm">{d.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
