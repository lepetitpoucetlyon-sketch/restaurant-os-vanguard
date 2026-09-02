'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  CreditCard,
  Flame,
  Tablet,
  Laptop,
  ShieldAlert,
  RefreshCw,
  Trash2,
  Wifi,
  Clock,
  User,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Modal } from '@ui/Modal';
import { useTenant, useAuth } from '@/shared/providers/NexusCoreProvider';
import { DeviceFleetManager, type DeviceRecord } from '@/modules/facility';
import { useToast } from '@ui/Toast';

export interface DeviceFleetInventoryModalProps {
  open: boolean;
  onClose: () => void;
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  pos_fixed: Monitor,
  kds_kitchen: Flame,
  tpe_handheld: CreditCard,
  mobile_staff: Smartphone,
  kiosk_totem: Tablet,
  laptop_manager: Laptop,
};

export function DeviceFleetInventoryModal({ open, onClose }: DeviceFleetInventoryModalProps) {
  const { activeTenantId } = useTenant();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceToRevoke, setDeviceToRevoke] = useState<DeviceRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('Vol ou perte du téléphone');
  const [isRevoking, setIsRevoking] = useState(false);

  const loadFleet = useCallback(async () => {
    if (!activeTenantId) return;
    setIsLoading(true);
    try {
      const records = await DeviceFleetManager.listDevices(activeTenantId);
      setDevices(records);
    } catch {
      showToast('Impossible de charger la flotte de terminaux', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId, showToast]);

  useEffect(() => {
    if (open) {
      void loadFleet();
    }
  }, [open, loadFleet]);

  const handleRevoke = async () => {
    if (!deviceToRevoke || !activeTenantId) return;
    setIsRevoking(true);
    try {
      await DeviceFleetManager.revokeDevice(
        activeTenantId,
        deviceToRevoke.deviceId,
        currentUser?.name || currentUser?.id || 'Directeur',
        revokeReason
      );
      showToast(`🚨 Terminal ${deviceToRevoke.deviceName} révoqué — Remote Wipe envoyé`, 'success');
      setDeviceToRevoke(null);
      await loadFleet();
    } catch {
      showToast('Erreur lors de la révocation du terminal', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={open && !deviceToRevoke}
        onClose={onClose}
        title="Flotte de Terminaux & Kill-Switch Sécurité"
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Top Banner */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">
                Inventaire en temps réel des caisses, TPE, KDS et téléphones autorisés à accéder à Restaurant OS.
              </p>
            </div>
            <button
              onClick={loadFleet}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-1.5 hover:bg-surface-card transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* List of devices */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              Chargement de la flotte...
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border rounded-2xl space-y-2">
              <Monitor className="w-8 h-8 text-text-muted mx-auto opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun terminal enregistré</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Les appareils s&apos;enregistrent automatiquement lors de leur première connexion ou appairage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {devices.map((device) => {
                const Icon = DEVICE_ICONS[device.deviceType] || Monitor;
                const isRevoked = device.status === 'revoked';

                return (
                  <div
                    key={device.deviceId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isRevoked
                        ? 'bg-rose-500/5 border-rose-500/20 opacity-75'
                        : 'bg-surface-card border-border/80 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isRevoked
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary truncate max-w-[9.375rem]">
                            {device.deviceName}
                          </h4>
                          <p className="text-micro text-text-muted flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {device.userName || 'Non assigné'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-nano uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          isRevoked
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isRevoked ? 'Révoqué' : 'Actif'}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-micro text-text-muted">
                      <div className="flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-text-muted shrink-0" />
                        <span>{new Date(device.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {device.lastWifiBssid && (
                        <div className="flex items-center gap-1 truncate">
                          <Wifi className="w-3 h-3 text-text-muted shrink-0" />
                          <span>{device.lastWifiBssid}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-2 flex justify-end">
                      {!isRevoked ? (
                        <button
                          onClick={() => setDeviceToRevoke(device)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Kill-Switch (Bloquer)
                        </button>
                      ) : (
                        <span className="text-micro text-rose-400 italic">
                          Accès & cache révoqués
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal for Kill-Switch */}
      {deviceToRevoke && (
        <Modal
          isOpen={!!deviceToRevoke}
          onClose={() => setDeviceToRevoke(null)}
          title="Confirmer la révocation du terminal"
          size="sm"
        >
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-text-primary">
                Bloquer {deviceToRevoke.deviceName} ?
              </h3>
              <p className="text-xs text-text-muted">
                Ce terminal sera immédiatement déconnecté. Son cache local sera purgé et tout nouvel accès sera refusé en 403.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-text-secondary">Motif de la révocation</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full p-2.5 bg-surface-card border border-border rounded-xl text-xs text-text-primary"
              >
                <option value="Vol ou perte du téléphone">Vol ou perte du téléphone</option>
                <option value="Départ du salarié / Fin de contrat">Départ du salarié / Fin de contrat</option>
                <option value="Suspicion d'intrusion de sécurité">Suspicion d&apos;intrusion de sécurité</option>
                <option value="Remplacement du matériel">Remplacement du matériel</option>
              </select>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDeviceToRevoke(null)}
                disabled={isRevoking}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-surface-card transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
              >
                {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmer le blocage
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
