'use client';

import { useState, useEffect } from 'react';
import { Loader2, Globe, WifiOff } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TableSchema } from '@/modules/ops';
import { toast } from 'sonner';
import { z } from 'zod';

type Table = z.infer<typeof TableSchema> & { onlineBookable?: boolean };

interface Props {
  tenantId: string;
}

export default function OnlineBookingToggle({ tenantId }: Props) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const unsubscribe = Nexus.adapter.onSnapshot<Table>(
      'tables',
      (data) => {
        if (cancelled) return;
        // onSnapshot for a collection returns array via options, but here we use query
        // Fallback: handle both array and single doc
        if (Array.isArray(data)) {
          setTables(data);
        }
        setLoading(false);
      },
      {
        onError: () => {
          if (!cancelled) setLoading(false);
        },
      },
      { vassalId: tenantId, actorId: 'system' }
    );

    // onSnapshot fires immediately with cached data — no fallback query needed.
    // Timeout safety: if onSnapshot hasn't fired after 5s, clear loading.
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && loading) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [tenantId]);

  const toggle = async (table: Table) => {
    const next = !table.onlineBookable;
    setUpdating(table.id);
    try {
      await Nexus.adapter.update(
        `tables/${table.id}`,
        { onlineBookable: next, updatedAt: Date.now() },
        { vassalId: tenantId, actorId: 'system' }
      );
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, onlineBookable: next } : t))
      );
      toast.success(
        next
          ? `Table ${table.number} activee en ligne`
          : `Table ${table.number} desactivee en ligne`
      );
    } catch {
      toast.error('Echec de la mise a jour');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-6">
        Aucune table trouvee. Configurez vos tables dans les parametres Salle.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tables.map((table) => {
        const isOn = !!table.onlineBookable;
        const busy = updating === table.id;
        return (
          <div
            key={table.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-bg-primary px-4 py-3 hover:bg-bg-secondary transition"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border ${isOn ? 'bg-green-50 border-green-200 text-green-700' : 'bg-bg-tertiary border-border text-text-muted'}`}>
                {table.number}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Table {table.number}</p>
                <p className="text-xs text-text-muted">{table.seats} place{table.seats > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(table)}
              disabled={busy}
              aria-label={isOn ? 'Desactiver la reservation en ligne' : 'Activer la reservation en ligne'}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                busy
                  ? 'opacity-50 cursor-not-allowed border-border text-text-muted'
                  : isOn
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                  : 'bg-bg-secondary border-border text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isOn ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              {isOn ? 'En ligne' : 'Hors ligne'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
