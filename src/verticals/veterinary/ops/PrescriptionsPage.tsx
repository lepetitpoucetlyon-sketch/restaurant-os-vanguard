'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { CareLoadAnalyticsService } from '../domain/CareLoadAnalyticsService';
import type { IPrescription } from '../domain/types';

export function PrescriptionsPage() {
  const { activeTenantId } = useTenant();
  const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    CareLoadAnalyticsService.listActivePrescriptions(activeTenantId)
      .then(setPrescriptions)
      .catch((e) => console.error('[PrescriptionsPage]', e))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ordonnances & Pharmacie</h1>

      {prescriptions.length === 0 && <p className="text-sm text-gray-500">Aucune ordonnance active.</p>}

      <div className="space-y-2">
        {prescriptions.map(p => (
          <div key={p.id} className="rounded-lg border p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.petName} — {p.medication}</div>
              <div className="text-xs text-gray-500">
                {p.dosage} · Dr {p.vetName} · expire le {p.expiresAt}
              </div>
            </div>
            <div className="text-sm">{p.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
