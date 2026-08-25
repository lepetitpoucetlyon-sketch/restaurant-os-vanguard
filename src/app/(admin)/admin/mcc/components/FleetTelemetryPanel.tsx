"use client";

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface TelemetryDevice {
  deviceId: string;
  tenantId: string;
  lastSeen?: number | string;
}

interface TelemetryCrash {
  id: string;
  errorName: string;
  errorMessage: string;
  tenantId: string;
}

export function FleetTelemetryPanel() {
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [crashes, setCrashes] = useState<TelemetryCrash[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        const [devs, crs] = await Promise.all([
          Nexus.adapter.query('mcc/telemetry/devices'),
          Nexus.adapter.query('mcc/telemetry/crashes')
        ]);
        if (!active) return;
        setDevices(devs as unknown as TelemetryDevice[]);
        setCrashes(crs as unknown as TelemetryCrash[]);
      } catch (e) {
        logger.error('Failed to fetch telemetry', { error: e });
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 30000); // refresh every 30s
    return () => { active = false; clearInterval(id); };
  }, []);

  const now = new Date().getTime();
  
  // Heartbeat > 3 minutes (180000 ms) = Offline
  const offlineDevices = devices.filter(d => {
    if (!d.lastSeen) return true;
    return (now - new Date(d.lastSeen).getTime()) > 180000;
  });

  const onlineDevices = devices.length - offlineDevices.length;

  return (
    <div className="bg-surface-card border border-border-subtle rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Activity className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest">Télémétrie de la Flotte</h3>
          <p className="text-xs text-secondary">Signaux de vie & Rapports de plantage en temps réel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-surface-card border border-border-subtle rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-chip-label text-secondary">Pouls Réseau</span>
            {offlineDevices.length === 0 ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{onlineDevices}</span>
            <span className="text-xs text-secondary">/ {devices.length} En Ligne</span>
          </div>
          {offlineDevices.length > 0 && (
            <div className="mt-2 text-nano text-rose-500 font-bold uppercase tracking-widest">
              {offlineDevices.length} Instance(s) Hors Ligne
            </div>
          )}
        </div>

        <div className="p-4 bg-surface-card border border-border-subtle rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-chip-label text-secondary">Rapports de Plantage</span>
            <AlertTriangle className={`w-4 h-4 ${crashes.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{crashes.length}</span>
            <span className="text-xs text-secondary">Enregistrés</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-chip-label text-secondary mb-3">Nœuds Critiques Hors Ligne</h4>
          {loading ? (
            <div className="text-xs text-muted animate-pulse">Analyse en cours...</div>
          ) : offlineDevices.length === 0 ? (
            <div className="text-xs text-emerald-500 font-medium">Tous les nœuds transmettent un signal nominal.</div>
          ) : (
            <div className="space-y-2">
              {offlineDevices.slice(0, 5).map(d => (
                <div key={d.deviceId} className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-text-primary">{d.tenantId}</div>
                    <div className="text-nano text-secondary">Appareil : {d.deviceId}</div>
                  </div>
                  <div className="text-nano text-rose-500 font-bold uppercase">
                    Vu le : {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : 'Inconnu'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {crashes.length > 0 && (
          <div className="pt-4 border-t border-border-subtle">
            <h4 className="text-chip-label text-secondary mb-3">Derniers Plantages</h4>
            <div className="space-y-2">
              {crashes.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="truncate pr-4">
                    <div className="text-xs font-bold text-amber-500">{c.errorName}</div>
                    <div className="text-nano text-secondary truncate">{c.errorMessage}</div>
                  </div>
                  <div className="text-nano text-secondary whitespace-nowrap">
                    {c.tenantId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
