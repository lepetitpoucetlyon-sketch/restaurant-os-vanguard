"use client";

/**
 * FleetDeviceInventory — mcc-mdm-3
 * Vue croisée : quel tenant possède quels iPads, état, version OS.
 * Affectation des numéros de série stockée dans mcc/deviceAssignments/{tenantId}.
 * Kill switch mcc-mdm-1 lit ce même chemin.
 */
import { useState, useEffect, useCallback } from "react";
import { Tablet, Plus, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";

interface DeviceAssignment {
  serialNumbers: string[];
  updatedAt?: number;
}

interface TenantRow {
  tenantId: string;
  name: string;
}

interface FleetRow extends TenantRow {
  serials: string[];
  loading: boolean;
  error: string | null;
}

export function FleetDeviceInventory({ instances }: { instances: TenantRow[] }) {
  const [rows, setRows] = useState<FleetRow[]>([]);
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const loaded = await Promise.all(
      instances.map(async (inst) => {
        try {
          const doc = await Nexus.adapter.get(`mcc/deviceAssignments/${inst.tenantId}`) as DeviceAssignment | null;
          return { ...inst, serials: doc?.serialNumbers ?? [], loading: false, error: null };
        } catch {
          return { ...inst, serials: [], loading: false, error: "Erreur chargement" };
        }
      })
    );
    setRows(loaded);
  }, [instances]);

  useEffect(() => { void load(); }, [load]);

  async function addSerial(tenantId: string) {
    const sn = (inputMap[tenantId] ?? "").trim().toUpperCase();
    if (!sn) return;
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row || row.serials.includes(sn)) return;

    const updated = [...row.serials, sn];
    setSaving(s => ({ ...s, [tenantId]: true }));
    try {
      await Nexus.adapter.set(`mcc/deviceAssignments/${tenantId}`, {
        serialNumbers: updated,
        updatedAt: Date.now(),
      });
      setRows(r => r.map(x => x.tenantId === tenantId ? { ...x, serials: updated } : x));
      setInputMap(m => ({ ...m, [tenantId]: "" }));
    } finally {
      setSaving(s => ({ ...s, [tenantId]: false }));
    }
  }

  async function removeSerial(tenantId: string, sn: string) {
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row) return;
    const updated = row.serials.filter(s => s !== sn);
    setSaving(s => ({ ...s, [tenantId]: true }));
    try {
      await Nexus.adapter.set(`mcc/deviceAssignments/${tenantId}`, {
        serialNumbers: updated,
        updatedAt: Date.now(),
      });
      setRows(r => r.map(x => x.tenantId === tenantId ? { ...x, serials: updated } : x));
    } finally {
      setSaving(s => ({ ...s, [tenantId]: false }));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="p-6 bg-surface-card border border-border-subtle rounded-2xl text-center text-secondary text-sm">
        Aucun tenant chargé.
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Tablet className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Fleet Device Inventory</h3>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-surface-card transition-all">
          <RefreshCw className="w-4 h-4 text-secondary" />
        </button>
      </div>

      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.tenantId} className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary truncate max-w-[60%]">{row.name}</span>
              <span className="text-[10px] text-secondary font-mono">{row.tenantId.slice(0, 12)}</span>
            </div>

            {row.error && (
              <div className="flex items-center gap-2 text-action-primary text-xs">
                <AlertTriangle className="w-3 h-3" /> {row.error}
              </div>
            )}

            {row.serials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {row.serials.map(sn => (
                  <span key={sn} className="flex items-center gap-1.5 bg-surface-card text-[11px] font-mono px-2.5 py-1 rounded-lg">
                    {sn}
                    <button
                      onClick={() => removeSerial(row.tenantId, sn)}
                      disabled={saving[row.tenantId]}
                      className="hover:text-status-danger transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {row.serials.length === 0 && !row.error && (
              <p className="text-[11px] text-secondary italic">Aucun appareil affecté</p>
            )}

            <div className="flex gap-2">
              <input
                value={inputMap[row.tenantId] ?? ""}
                onChange={e => setInputMap(m => ({ ...m, [row.tenantId]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') void addSerial(row.tenantId); }}
                placeholder="N° de série (ex: C07X1234ABCD)"
                className="flex-1 bg-surface-card border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-mono placeholder:text-secondary/40 focus:outline-none focus:border-focus/50"
              />
              <button
                onClick={() => addSerial(row.tenantId)}
                disabled={saving[row.tenantId] || !(inputMap[row.tenantId] ?? "").trim()}
                className="flex items-center gap-1 bg-action-primary/20 border border-focus/30 text-brand text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-action-primary/30 transition-all disabled:opacity-40"
              >
                <Plus className="w-3 h-3" /> Affecter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
