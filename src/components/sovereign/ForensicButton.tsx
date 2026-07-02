"use client";

import React, { useCallback, useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { authedFetch } from '@/lib/client/authedFetch';
import { toast } from 'sonner';

export function ForensicButton() {
  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleForensicCapture = useCallback(async () => {
    if (!activeTenantId) {
      toast.error('Aucun tenant actif');
      return;
    }

    setLoading(true);
    try {
      const yearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

      const res = await authedFetch('/api/admin/finance/fec/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ciblage explicite pour un fleet_admin ; pour un admin tenant,
          // le serveur impose le tenant du token.
          'x-nexus-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ siren: '', yearMonth }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        toast.error(`Export FEC échoué : ${err.error ?? res.statusText}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FEC_${activeTenantId}_${yearMonth}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Export FEC ${yearMonth} téléchargé`);
    } catch (err) {
      toast.error(`Erreur export FEC : ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  return (
    <button
      onClick={handleForensicCapture}
      disabled={loading}
      className="fixed bottom-4 right-4 z-50 bg-status-danger hover:bg-status-danger text-white font-bold py-2 px-4 rounded shadow-lg flex items-center gap-2 transition-colors disabled:opacity-60"
      aria-label="Export FEC Forensic"
    >
      <span>{loading ? '⏳ Export…' : '📋 Export FEC'}</span>
    </button>
  );
}
