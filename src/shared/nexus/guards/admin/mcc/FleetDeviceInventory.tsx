"use client";

/**
 * FleetDeviceInventory — mcc-mdm-3
 * Vue croisée : quel tenant possède quels iPads, état, version OS.
 * Gestion Hybride (ABM / MDM) et logistique.
 */
import { useState, useEffect, useCallback } from "react";
import { Tablet, Plus, Trash2, RefreshCw, AlertTriangle, Truck, ShieldAlert, CheckCircle, Apple, QrCode, PowerOff } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { authedFetch } from "@/lib/client/authedFetch";

type EnrollmentType = 'NATIVE_ABM' | 'SOFTWARE_MDM';
type DeviceStatus = 'PREPARATION' | 'SHIPPED' | 'DELIVERED' | 'LOCKED';

interface HardwareDevice {
  serialNumber: string;
  enrollmentType: EnrollmentType;
  status: DeviceStatus;
  trackingNumber?: string;
}

interface DeviceAssignment {
  devices: HardwareDevice[];
  updatedAt?: number;
}

interface TenantRow {
  tenantId: string;
  name: string;
}

interface FleetRow extends TenantRow {
  devices: HardwareDevice[];
  loading: boolean;
  error: string | null;
}

export function FleetDeviceInventory({ instances }: { instances: TenantRow[] }) {
  const [rows, setRows] = useState<FleetRow[]>([]);
  const [inputMap, setInputMap] = useState<Record<string, { sn: string, type: EnrollmentType, tracking: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [pendingDelivery, setPendingDelivery] = useState<{ tenantId: string; device: HardwareDevice } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    const loaded = await Promise.all(
      instances.map(async (inst) => {
        try {
          const doc = await Nexus.adapter.get(`mcc/deviceAssignments/${inst.tenantId}`) as any;
          let devices: HardwareDevice[] = [];
          if (doc) {
            if (doc.devices) {
              devices = doc.devices;
            } else if (doc.serialNumbers) {
              // Backward compatibility
              devices = doc.serialNumbers.map((sn: string) => ({ 
                serialNumber: sn, 
                enrollmentType: 'SOFTWARE_MDM', 
                status: 'DELIVERED' 
              }));
            }
          }
          return { ...inst, devices, loading: false, error: null };
        } catch {
          return { ...inst, devices: [], loading: false, error: "Erreur chargement" };
        }
      })
    );
    setRows(loaded);
  }, [instances]);

  useEffect(() => { void load(); }, [load]);

  const updateDevicesInDb = async (tenantId: string, updatedDevices: HardwareDevice[]) => {
    setSaving(s => ({ ...s, [tenantId]: true }));
    try {
      await Nexus.adapter.set(`mcc/deviceAssignments/${tenantId}`, {
        devices: updatedDevices,
        updatedAt: Date.now(),
      });
      setRows(r => r.map(x => x.tenantId === tenantId ? { ...x, devices: updatedDevices } : x));
    } finally {
      setSaving(s => ({ ...s, [tenantId]: false }));
    }
  };

  async function addDevice(tenantId: string) {
    const input = inputMap[tenantId] || { sn: '', type: 'NATIVE_ABM', tracking: '' };
    const sn = input.sn.trim().toUpperCase();
    if (!sn) return;
    
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row || row.devices.some(d => d.serialNumber === sn)) return;

    const newDevice: HardwareDevice = {
      serialNumber: sn,
      enrollmentType: input.type,
      status: input.tracking ? 'SHIPPED' : 'PREPARATION',
      trackingNumber: input.tracking
    };

    const updated = [...row.devices, newDevice];
    await updateDevicesInDb(tenantId, updated);
    setInputMap(m => ({ ...m, [tenantId]: { sn: '', type: 'NATIVE_ABM', tracking: '' } }));
    toast.success("Appareil ajouté à l'inventaire");
  }

  async function removeDevice(tenantId: string, sn: string) {
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row) return;
    const updated = row.devices.filter(s => s.serialNumber !== sn);
    await updateDevicesInDb(tenantId, updated);
  }

  async function simulateDelivery(tenantId: string, device: HardwareDevice) {
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row) return;

    try {
      // Simulation call to start billing
      await authedFetch('/api/admin/mcc/fleet/devices/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, serialNumber: device.serialNumber })
      });
      toast.success("Livraison confirmée. Facturation Stripe démarrée.");
    } catch (err) {
      logger.warn("Simulated delivery failed", String(err));
    }

    const updated = row.devices.map(d => 
      d.serialNumber === device.serialNumber ? { ...d, status: 'DELIVERED' as DeviceStatus } : d
    );
    await updateDevicesInDb(tenantId, updated);
  }

  async function toggleKillSwitch(tenantId: string, device: HardwareDevice) {
    const row = rows.find(r => r.tenantId === tenantId);
    if (!row) return;

    const isLocked = device.status === 'LOCKED';
    const newStatus = isLocked ? 'DELIVERED' : 'LOCKED';

    try {
      await authedFetch('/api/admin/mcc/fleet/devices/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, serialNumber: device.serialNumber, lock: !isLocked })
      });
      toast.success(isLocked ? "Appareil déverrouillé" : "Kill Switch activé. Appareil verrouillé.");
    } catch (err) {
      logger.warn("Kill switch API failed", String(err));
    }

    const updated = row.devices.map(d => 
      d.serialNumber === device.serialNumber ? { ...d, status: newStatus as DeviceStatus } : d
    );
    await updateDevicesInDb(tenantId, updated);
  }

  if (rows.length === 0) {
    return (
      <div className="p-6 bg-surface-card border border-border-subtle rounded-2xl text-center text-secondary text-sm">
        Aucun tenant chargé.
      </div>
    );
  }

  return (
    <>
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Tablet className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Inventaire Matériel Flotte</h3>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-surface-card transition-all">
          <RefreshCw className="w-4 h-4 text-secondary" />
        </button>
      </div>

      <div className="space-y-4">
        {rows.map(row => {
          const input = inputMap[row.tenantId] || { sn: '', type: 'NATIVE_ABM', tracking: '' };
          return (
            <div key={row.tenantId} className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-sm font-bold text-text-primary uppercase tracking-tight">{row.name}</span>
                <span className="text-[10px] text-secondary font-mono tracking-widest">{row.tenantId}</span>
              </div>

              {row.error && (
                <div className="flex items-center gap-2 text-status-danger text-xs bg-status-danger/10 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" /> {row.error}
                </div>
              )}

              {row.devices.length > 0 && (
                <div className="space-y-2">
                  {row.devices.map(device => (
                    <div key={device.serialNumber} className={`flex items-center justify-between p-3 rounded-lg border ${device.status === 'LOCKED' ? 'bg-status-danger/5 border-red-500/30' : 'bg-surface-card border-border-subtle'}`}>
                      <div className="flex items-center gap-3">
                        {device.enrollmentType === 'NATIVE_ABM' ? (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white" title="Apple Business Manager (Neuf)"><Apple className="w-4 h-4" /></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400" title="MDM Profil (Reconditionné)"><QrCode className="w-4 h-4" /></div>
                        )}
                        <div>
                          <p className="text-xs font-mono font-bold text-text-primary">{device.serialNumber}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              device.status === 'PREPARATION' ? 'text-status-warning' :
                              device.status === 'SHIPPED' ? 'text-brand' :
                              device.status === 'DELIVERED' ? 'text-status-success' :
                              'text-status-danger'
                            }`}>
                              {device.status}
                            </span>
                            {device.trackingNumber && (
                              <span className="text-[9px] text-secondary font-mono flex items-center gap-1">
                                <Truck className="w-3 h-3" /> {device.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {device.status === 'SHIPPED' && (
                          <button onClick={() => setPendingDelivery({ tenantId: row.tenantId, device })} className="p-2 bg-emerald-500/10 text-status-success rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20" title="Confirmer Livraison (Déclenche Stripe)">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => toggleKillSwitch(row.tenantId, device)} className={`p-2 rounded-lg transition-all border ${device.status === 'LOCKED' ? 'bg-status-danger text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-surface-card text-status-danger hover:bg-status-danger/10 border-red-500/20'}`} title="Kill Switch (Verrouillage MDM)">
                          <PowerOff className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeDevice(row.tenantId, device.serialNumber)} className="p-2 bg-surface-card text-muted rounded-lg hover:text-status-danger hover:bg-status-danger/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {row.devices.length === 0 && !row.error && (
                <p className="text-[11px] text-secondary italic text-center py-2">Aucun matériel affecté à cette instance.</p>
              )}

              {/* Add Device Form */}
              <div className="mt-4 p-3 bg-surface-bg border border-border-subtle rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <select 
                    value={input.type} 
                    onChange={e => setInputMap(m => ({ ...m, [row.tenantId]: { ...input, type: e.target.value as EnrollmentType } }))}
                    className="bg-surface-card border border-border-subtle rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="NATIVE_ABM">ABM (Neuf)</option>
                    <option value="SOFTWARE_MDM">MDM (Recond.)</option>
                  </select>
                  <input
                    value={input.sn}
                    onChange={e => setInputMap(m => ({ ...m, [row.tenantId]: { ...input, sn: e.target.value } }))}
                    placeholder="S/N (ex: C07X...)"
                    className="flex-1 bg-surface-card border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-mono placeholder:text-secondary/40 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={input.tracking}
                    onChange={e => setInputMap(m => ({ ...m, [row.tenantId]: { ...input, tracking: e.target.value } }))}
                    placeholder="N° Suivi Transporteur (Optionnel)"
                    className="flex-1 bg-surface-card border border-border-subtle rounded-lg px-3 py-1.5 text-[10px] font-mono placeholder:text-secondary/40 focus:outline-none focus:border-brand"
                  />
                  <button
                    onClick={() => addDevice(row.tenantId)}
                    disabled={saving[row.tenantId] || !input.sn.trim()}
                    className="flex items-center gap-1 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-brand/90 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {pendingDelivery && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-surface-sidebar/80 backdrop-blur-sm" onClick={() => !confirming && setPendingDelivery(null)} />
        <div className="relative w-full max-w-sm bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-status-success/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Confirmer la livraison</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Cette action démarre la <span className="text-text-primary font-semibold">facturation Stripe</span> pour l&apos;appareil{' '}
                <span className="font-mono text-brand">{pendingDelivery.device.serialNumber}</span>.
                Elle ne peut pas être annulée.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setPendingDelivery(null)}
              disabled={confirming}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                setConfirming(true);
                await simulateDelivery(pendingDelivery.tenantId, pendingDelivery.device);
                setConfirming(false);
                setPendingDelivery(null);
              }}
              disabled={confirming}
              className="flex-1 py-2.5 bg-status-success text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {confirming ? 'Facturation…' : 'Confirmer & Facturer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
