'use client';

// ENV requis (à ajouter dans .env.local) :
// MOSYLE_API_KEY=your-mosyle-api-key
//
// Structure API Mosyle (documentation officielle) :
// GET  /v1/listdevices       → liste de tous les appareils gérés
// PUT  /v1/mdm/{deviceId}/lock → verrouiller un appareil
// PUT  /v1/mdm/{deviceId}/erase → effacer un appareil (IRRÉVERSIBLE)
//
// Authentification : Authorization: Bearer MOSYLE_API_KEY
// Base URL : https://businessapi.mosyle.com

import { useState, useEffect } from 'react';
import {
  Smartphone,
  WifiOff,
  Wifi,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

type DeviceStatus = 'online' | 'offline';

interface Device {
  serialNumber: string;
  deviceName: string;
  model: string;
  status: DeviceStatus;
  lastSeen: string;
  osVersion: string;
  batteryLevel: number;
}


interface EraseConfirmDialogProps {
  device: Device;
  onConfirm: () => void;
  onCancel: () => void;
}

function EraseConfirmDialog({ device, onConfirm, onCancel }: EraseConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const isReady = confirmText === 'ERASE CONFIRMED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-bg-primary p-6 space-y-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-status-danger flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-bold text-text-primary">Action irréversible</h4>
            <p className="text-sm text-text-secondary mt-1">
              Vous êtes sur le point d'effacer complètement{' '}
              <strong className="text-text-primary">{device.deviceName}</strong>{' '}
              ({device.serialNumber}). Toutes les données seront supprimées.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-status-danger/10 border border-red-500/20 p-3">
          <p className="text-xs text-status-danger font-semibold">
            Cette action nécessite le rôle <code className="bg-status-danger/10 px-1 rounded">super_admin</code> et ne peut pas être annulée.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
            Tapez ERASE CONFIRMED pour valider
          </label>
          <input
            type="text"
            placeholder="ERASE CONFIRMED"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-bg-secondary text-text-primary text-sm font-semibold hover:bg-bg-primary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!isReady}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-status-danger text-text-primary text-sm font-bold hover:bg-status-danger transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Effacer
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeviceRowProps {
  device: Device;
  onLock: (device: Device) => void;
  onEraseRequest: (device: Device) => void;
  isLocking: boolean;
}

function DeviceRow({ device, onLock, onEraseRequest, isLocking }: DeviceRowProps) {
  const isOnline = device.status === 'online';

  const lastSeenDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(device.lastSeen));

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-primary hover:bg-bg-secondary transition-colors">
      {/* Icône appareil */}
      <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-text-muted" />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {device.deviceName}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${
              isOnline ? 'text-status-success' : 'text-text-muted'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {device.serialNumber} · {device.model} · {device.osVersion}
        </p>
        <p className="text-xs text-text-muted">
          Vu : {lastSeenDate} · Batterie : {device.batteryLevel}%
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onLock(device)}
          disabled={isLocking}
          title="Verrouiller l'appareil"
          className="p-2 rounded-lg border border-border text-text-muted hover:text-action-primary hover:border-action-primary/30 hover:bg-action-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLocking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onEraseRequest(device)}
          title="Effacer l'appareil (super_admin requis)"
          className="p-2 rounded-lg border border-border text-text-muted hover:text-status-danger hover:border-red-500/30 hover:bg-status-danger/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function MDMPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [eraseTarget, setEraseTarget] = useState<Device | null>(null);

  useEffect(() => {
    authedFetch('/api/admin/mdm/devices')
      .then(r => r.json())
      .then((data: { devices: Device[]; demo: boolean }) => {
        setDevices(data.devices ?? []);
        setIsDemoMode(data.demo ?? false);
      })
      .catch(() => setDevices([]))
      .finally(() => setIsLoadingDevices(false));
  }, []);

  const handleLock = async (device: Device) => {
    setLockingId(device.serialNumber);
    try {
      const res = await authedFetch('/api/admin/mdm/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber: device.serialNumber }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(`${device.deviceName} verrouillé`);
    } catch {
      toast.error(`Erreur lors du verrouillage de ${device.deviceName}`);
    } finally {
      setLockingId(null);
    }
  };

  const handleEraseConfirm = async () => {
    if (!eraseTarget) return;

    try {
      const res = await authedFetch('/api/admin/mdm/erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: eraseTarget.serialNumber,
          confirmation: 'ERASE CONFIRMED',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(`${eraseTarget.deviceName} effacé`);
      setDevices(prev => prev.filter(d => d.serialNumber !== eraseTarget.serialNumber));
    } catch {
      toast.error(`Erreur lors de l'effacement`);
    } finally {
      setEraseTarget(null);
    }
  };

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <>
      {eraseTarget && (
        <EraseConfirmDialog
          device={eraseTarget}
          onConfirm={handleEraseConfirm}
          onCancel={() => setEraseTarget(null)}
        />
      )}

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Gestion des appareils (MDM)
            </h3>
            <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
              Mosyle Business API
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
            <Wifi className="w-3.5 h-3.5 text-status-success" />
            <span>{onlineCount}/{devices.length} en ligne</span>
            {isDemoMode && (
              <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-text-muted border border-border rounded-full px-1.5 py-0.5">
                démo
              </span>
            )}
          </div>
        </div>

        {/* Note .env */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4">
          <p className="text-xs text-text-muted font-mono">
            # .env.local — requis pour les appels Mosyle réels
          </p>
          <p className="text-xs text-text-primary font-mono mt-0.5">
            MOSYLE_API_KEY=votre_cle_api_mosyle
          </p>
          <p className="text-xs text-text-muted mt-2">
            Données actuellement en mode démo. Connectez votre compte Mosyle Business
            pour gérer les appareils réels.
          </p>
        </div>

        {/* Liste des appareils */}
        <div className="space-y-3">
          {isLoadingDevices ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Chargement des appareils…
            </div>
          ) : devices.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-8">Aucun appareil trouvé.</p>
          ) : devices.map(device => (
            <DeviceRow
              key={device.serialNumber}
              device={device}
              onLock={handleLock}
              onEraseRequest={setEraseTarget}
              isLocking={lockingId === device.serialNumber}
            />
          ))}
        </div>
      </div>
    </>
  );
}
