'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { MembershipAnalyticsService } from '../domain/MembershipAnalyticsService';
import type { IClassSession } from '../domain/types';

export function ClassSchedulePage() {
  const { activeTenantId } = useTenant();
  const [sessions, setSessions] = useState<IClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    MembershipAnalyticsService.listUpcomingClasses(activeTenantId)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Planning des Cours</h1>

      {sessions.length === 0 && (
        <p className="text-sm text-gray-500">Aucun cours à venir programmé.</p>
      )}

      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="rounded-lg border p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{s.className}</div>
              <div className="text-xs text-gray-500">
                Coach {s.coachName} · {new Date(s.startsAt).toLocaleString('fr-FR')} · {s.durationMinutes} min
              </div>
            </div>
            <div className="text-sm">{s.bookedCount}/{s.capacity} inscrits</div>
          </div>
        ))}
      </div>
    </div>
  );
}
