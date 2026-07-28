'use client';

import React, { useEffect, useState } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { revokeDevice } from '@/infrastructure/services/sovereign/lockdown';
import { ShieldAlert, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';

interface Device {
  id: string; // fingerprint
  fingerprint: string;
  certifiedAt: string;
  certifiedVia?: string;
  userAgent: string;
  revoked?: boolean;
  revokedAt?: string;
}

export function DeviceManager({ uid }: { uid: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const fetchedDevices = await Nexus.adapter.query<Device>(`users/${uid}/certifiedDevices`);
      setDevices(fetchedDevices);
    } catch (err) {
      logger.warn('[DeviceManager] Failed to fetch devices', String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uid) {
      fetchDevices();
    }
  }, [uid]);

  const handleRevoke = async (fingerprint: string) => {
    try {
      await revokeDevice(uid, fingerprint);
      await fetchDevices(); // Refresh
    } catch (err) {
      console.error("Failed to revoke device", err);
    }
  };

  if (loading) {
    return <div className="p-4 text-secondary text-xs font-bold uppercase tracking-widest">Loading Devices...</div>;
  }

  return (
    <div className="bg-[#0f0f11] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-5 h-5 text-brand" />
        <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Certified Devices</h3>
      </div>
      
      {devices.length === 0 ? (
        <p className="text-xs text-secondary font-medium">Aucun appareil certifié trouvé pour cet utilisateur.</p>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <motion.div 
              key={device.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center justify-between ${device.revoked ? 'bg-status-danger/5 border-red-500/20' : 'bg-surface-card/5 border-subtle'}`}
            >
              <div className="flex items-center gap-4">
                {device.revoked ? (
                  <ShieldAlert className="w-8 h-8 text-status-danger" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-status-success" />
                )}
                <div>
                  <p className="text-sm font-bold text-text-primary font-mono">{device.fingerprint.substring(0, 12)}...</p>
                  <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">
                    {device.userAgent.substring(0, 40)}...
                  </p>
                  <div className="flex gap-2 mt-2 text-[9px] font-black uppercase tracking-wider">
                    {device.revoked ? (
                      <span className="text-status-danger">Revoked on {new Date(device.revokedAt!).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-status-success">Certified on {new Date(device.certifiedAt).toLocaleDateString()}</span>
                    )}
                    {device.certifiedVia && <span className="text-brand">Via {device.certifiedVia}</span>}
                  </div>
                </div>
              </div>

              {!device.revoked && (
                <button 
                  onClick={() => handleRevoke(device.id)}
                  className="p-2 bg-status-danger/10 text-status-danger rounded-lg hover:bg-status-danger/20 transition-colors border border-red-500/20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Révoquer
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
