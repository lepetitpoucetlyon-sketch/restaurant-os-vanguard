"use client";

import React, { useEffect, useState } from 'react';
import { User, Shield, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import type { EmpireInstance } from '@/shared/nexus/contracts/fleet.types';
import type { User as TenantUser } from '@/domain/schemas/users';

interface Props {
  instance: EmpireInstance;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  cashier: 'Caissier',
  chef: 'Chef',
  server: 'Serveur',
};

export function TenantUsersPanel({ instance }: Props) {
  const [users, setUsers]       = useState<TenantUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [pinResult, setPinResult] = useState<{ userId: string; tempPin: string } | null>(null);
  const [roleEditing, setRoleEditing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/fleet/tenant-users?tenantId=${encodeURIComponent(instance.id)}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { users: TenantUser[] };
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [instance.id]);

  const handleResetPin = async (userId: string) => {
    const res = await fetch('/api/admin/fleet/users/reset-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: instance.id, userId }),
    });
    if (res.ok) {
      const { tempPin } = await res.json() as { tempPin: string };
      setPinResult({ userId, tempPin });
      setTimeout(() => setPinResult(null), 15000);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleEditing(null);
    await fetch('/api/admin/fleet/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: instance.id, userId, newRole }),
    });
    await load();
  };

  const handleImpersonate = async (userId: string) => {
    const res = await fetch('/api/admin/fleet/users/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: instance.id, userId }),
    });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
            Utilisateurs — {instance.name}
          </h3>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <p className="text-xs text-status-error mb-4">{error}</p>
      )}

      {pinResult && (
        <div className="mb-4 p-3 bg-action-primary/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-200">
            PIN temporaire pour l&apos;utilisateur : <strong className="font-mono tracking-widest">{pinResult.tempPin}</strong>
            {' '}— disparaît dans 15 s.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-xs text-secondary text-center py-6">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-action-primary/20 flex items-center justify-center font-bold text-brand text-xs shrink-0">
                  {u.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{u.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-secondary truncate">{u.email ?? '—'}</span>
                    {u.lastActive && (
                      <span className="flex items-center gap-1 text-[10px] text-secondary whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(u.lastActive).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Role selector */}
                <div className="relative">
                  <button
                    onClick={() => setRoleEditing(roleEditing === u.id ? null : u.id)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-secondary hover:text-text-primary transition-colors"
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {roleEditing === u.id && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-surface-bg border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[120px]">
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(u.id, role)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-secondary hover:text-text-primary transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleResetPin(u.id)}
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-action-primary/10 border border-yellow-500/20 text-yellow-400 hover:bg-action-primary/20 transition-colors"
                >
                  Reset PIN
                </button>

                <button
                  onClick={() => handleImpersonate(u.id)}
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-action-primary/10 border border-focus/20 text-brand hover:bg-action-primary/20 transition-colors"
                >
                  Voir comme
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
