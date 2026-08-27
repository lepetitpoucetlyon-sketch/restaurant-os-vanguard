'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldX, Smartphone, Plus, Trash2, Edit3, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/shared/providers/NexusCoreProvider';
import { authedFetch } from '@/lib/client/authedFetch';
import type { MccRole } from '@/lib/server/adminAuthGuard';
import type { TrustedDevice } from '@/app/api/admin/fleet/trusted-devices/route';

/**
 * Génère une empreinte déterministe de l'appareil courant (client-side uniquement).
 * Utilise Web Crypto pour SHA-256(userAgent + screenW + screenH + timezone).
 * Non infaillible comme empreinte d'authentification, mais suffisant comme
 * second facteur "device is known" couplé au JWT Firebase.
 */
async function generateDeviceFingerprint(): Promise<string> {
    const raw = [
        navigator.userAgent,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
    ].join('|');

    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const STORAGE_KEY = 'mcc_device_fp';

const ROLE_LABELS: Record<MccRole, { label: string; color: string }> = {
    mcc_super_admin: { label: 'Super Admin MCC', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    mcc_support:     { label: 'MCC Support',     color: 'text-blue-400 bg-status-info/10 border-blue-500/20' },
    mcc_junior_dev:  { label: 'Junior Dev',      color: 'text-text-secondary bg-surface-card border-border-subtle' },
};

export function TrustedDevicePanel() {
    const { currentUser } = useAuth();
    const [devices, setDevices] = useState<TrustedDevice[]>([]);
    const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registerName, setRegisterName] = useState('');
    const [registerRole, setRegisterRole] = useState<MccRole>('mcc_junior_dev');
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState<TrustedDevice | null>(null);
    const [editRole, setEditRole] = useState<MccRole>('mcc_junior_dev');

    const loadDevices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authedFetch('/api/admin/fleet/trusted-devices');
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur');
            const data = await res.json();
            setDevices(data.devices ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
        // Charger ou générer l'empreinte de l'appareil courant
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            setMyFingerprint(cached);
        } else {
            generateDeviceFingerprint().then(fp => {
                localStorage.setItem(STORAGE_KEY, fp);
                setMyFingerprint(fp);
            });
        }
    }, [loadDevices]);

    const isMyDevice = (d: TrustedDevice) => myFingerprint && d.fingerprint.startsWith(myFingerprint.slice(0, 8));

    const handleRegister = async () => {
        if (!myFingerprint || !registerName.trim()) return;
        try {
            const res = await authedFetch('/api/admin/fleet/trusted-devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fingerprint: myFingerprint,
                    name: registerName.trim(),
                    role: registerRole,
                    ownerUid: currentUser?.uid,
                    ownerEmail: currentUser?.email ?? '',
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
            setRegisterName('');
            setShowRegisterForm(false);
            await loadDevices();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur');
        }
    };

    const handleRevoke = async (deviceId: string) => {
        try {
            const res = await authedFetch(`/api/admin/fleet/trusted-devices?deviceId=${deviceId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
            await loadDevices();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingDevice) return;
        try {
            const res = await authedFetch('/api/admin/fleet/trusted-devices', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: editingDevice.deviceId, role: editRole }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
            setEditingDevice(null);
            await loadDevices();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur');
        }
    };

    const myDeviceRegistered = myFingerprint
        ? devices.some(d => d.fingerprint === myFingerprint && d.status === 'active')
        : false;

    const activeDevices  = devices.filter(d => d.status === 'active');
    const revokedDevices = devices.filter(d => d.status === 'revoked');

    return (
        <div className="bg-surface-card border border-border-subtle rounded-3xl p-6 space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-status-success/10 rounded-xl">
                        <Shield className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Trusted Device Registry</h3>
                        <p className="text-nano text-text-muted">Appareils autorisés à accéder au MCC • ZTNA Layer 2</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border border-border-subtle bg-surface-card rounded-lg text-nano font-bold text-text-secondary uppercase tracking-widest">
                    <Wifi className="w-3 h-3" />
                    {activeDevices.length} actif{activeDevices.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Statut de l'appareil courant */}
            <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl ${myDeviceRegistered ? 'border-emerald-500/20 bg-status-success/5' : 'border-action-primary/20 bg-action-primary/5'}`}>
                <Smartphone className={`w-4 h-4 shrink-0 ${myDeviceRegistered ? 'text-status-success' : 'text-action-primary'}`} />
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${myDeviceRegistered ? 'text-status-success' : 'text-action-primary'}`}>
                        {myDeviceRegistered ? 'Cet appareil est dans le registre de confiance' : 'Cet appareil n\'est pas encore enregistré'}
                    </p>
                    {myFingerprint && (
                        <p className="text-nano text-text-muted font-mono mt-0.5 truncate">
                            fp: {myFingerprint.slice(0, 16)}…
                        </p>
                    )}
                </div>
                {!myDeviceRegistered && (
                    <button
                        onClick={() => setShowRegisterForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-action-primary/20 border border-action-primary/30 rounded-lg text-nano font-bold text-action-primary hover:bg-action-primary/30 transition-all uppercase tracking-widest shrink-0"
                    >
                        <Plus className="w-3 h-3" />
                        Enregistrer
                    </button>
                )}
            </div>

            {/* Formulaire d'enregistrement */}
            {showRegisterForm && (
                <div className="p-4 bg-surface-card border border-emerald-500/20 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-status-success uppercase tracking-widest">Enregistrer cet appareil</p>
                    <input
                        type="text"
                        value={registerName}
                        onChange={e => setRegisterName(e.target.value)}
                        placeholder="Nom de l'appareil (ex: MacBook Pro Mohammed)"
                        className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex gap-3">
                        <select
                            value={registerRole}
                            onChange={e => setRegisterRole(e.target.value as MccRole)}
                            className="flex-1 bg-surface-card border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="mcc_super_admin">Super Admin MCC (accès complet)</option>
                            <option value="mcc_support">Support MCC (+reset, RAG)</option>
                            <option value="mcc_junior_dev">Dev Junior (lecture seule)</option>
                        </select>
                        <button
                            onClick={handleRegister}
                            disabled={!registerName.trim()}
                            className="px-4 py-2.5 bg-status-success hover:bg-emerald-700 disabled:opacity-40 text-text-primary text-xs font-bold rounded-xl uppercase tracking-widest transition-all"
                        >
                            Confirmer
                        </button>
                        <button
                            onClick={() => setShowRegisterForm(false)}
                            className="px-4 py-2.5 bg-surface-card hover:bg-surface-hover text-text-secondary text-xs font-bold rounded-xl uppercase tracking-widest transition-all"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-status-danger/10 border border-red-500/20 rounded-xl text-xs text-status-danger">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Liste des appareils actifs */}
            {loading ? (
                <div className="text-center text-xs text-text-muted py-8">Chargement du registre…</div>
            ) : (
                <div className="space-y-3">
                    <p className="text-nano uppercase tracking-widest text-slate-600 font-bold">Appareils actifs ({activeDevices.length})</p>
                    {activeDevices.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
                            <WifiOff className="w-8 h-8 stroke-1" />
                            <p className="text-xs">Aucun appareil enregistré</p>
                        </div>
                    ) : (
                        activeDevices.map(device => {
                            const roleInfo = ROLE_LABELS[device.role] ?? ROLE_LABELS.mcc_junior_dev;
                            const isMine = isMyDevice(device);
                            return (
                                <div key={device.deviceId} className={`p-4 bg-surface-card border rounded-2xl space-y-2 ${isMine ? 'border-emerald-500/20' : 'border-border-subtle'}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ShieldCheck className={`w-4 h-4 shrink-0 ${isMine ? 'text-status-success' : 'text-text-secondary'}`} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-text-primary truncate">
                                                    {device.name}
                                                    {isMine && <span className="ml-2 text-nano text-status-success font-normal">(cet appareil)</span>}
                                                </p>
                                                <p className="text-nano text-text-muted font-mono">{device.fingerprint}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2 py-0.5 border rounded-md text-nano font-bold uppercase tracking-widest ${roleInfo.color}`}>
                                                {roleInfo.label}
                                            </span>
                                            <button
                                                onClick={() => { setEditingDevice(device); setEditRole(device.role); }}
                                                className="p-1.5 hover:bg-surface-hover rounded-lg transition-all text-text-muted hover:text-text-primary"
                                                title="Modifier le rôle"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(device.deviceId)}
                                                className="p-1.5 hover:bg-status-danger/10 rounded-lg transition-all text-text-muted hover:text-status-danger"
                                                title="Révoquer l'appareil"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-nano text-slate-600">
                                        <span>Ajouté {new Date(device.addedAt).toLocaleDateString('fr-FR')}</span>
                                        <span>•</span>
                                        <span>Vu {new Date(device.lastSeenAt).toLocaleDateString('fr-FR')}</span>
                                        <span>•</span>
                                        <span className="font-mono">{device.lastSeenIp}</span>
                                        {device.ownerEmail && <><span>•</span><span>{device.ownerEmail}</span></>}
                                    </div>

                                    {/* Routes restreintes pour les non-fleet-admin */}
                                    {device.allowedRoutes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {device.allowedRoutes.map(route => (
                                                <span key={route} className="px-2 py-0.5 bg-surface-card border border-border-subtle rounded text-nano font-mono text-text-muted">
                                                    {route}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Appareils révoqués (condensé) */}
                    {revokedDevices.length > 0 && (
                        <details className="group">
                            <summary className="flex items-center gap-2 text-nano uppercase tracking-widest text-slate-600 font-bold cursor-pointer select-none mt-4">
                                <ShieldX className="w-3 h-3" />
                                Révoqués ({revokedDevices.length})
                            </summary>
                            <div className="mt-2 space-y-2">
                                {revokedDevices.map(device => (
                                    <div key={device.deviceId} className="flex items-center gap-3 px-4 py-2.5 bg-surface-card border border-border-subtle rounded-xl opacity-50">
                                        <ShieldX className="w-3.5 h-3.5 text-status-danger shrink-0" />
                                        <span className="text-xs text-text-muted line-through">{device.name}</span>
                                        <span className="text-nano text-slate-600 ml-auto">{device.ownerEmail}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {/* Modal d'édition de rôle */}
            {editingDevice && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditingDevice(null)} aria-hidden="true">
                    <div role="dialog" aria-modal="true" aria-label="Modifier le rôle" className="bg-surface-card border border-border-subtle rounded-2xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-bold text-text-primary">Modifier le rôle</p>
                        <p className="text-xs text-text-secondary">{editingDevice.name}</p>
                        <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as MccRole)}
                            className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-violet-500/50"
                        >
                            <option value="mcc_super_admin">Super Admin MCC (accès complet)</option>
                            <option value="mcc_support">Support MCC (+reset, RAG)</option>
                            <option value="mcc_junior_dev">Dev Junior (lecture seule)</option>
                        </select>
                        <div className="flex gap-3">
                            <button onClick={handleUpdateRole} className="flex-1 px-4 py-2.5 bg-violet-600 text-text-primary text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-violet-700 transition-all">
                                Sauvegarder
                            </button>
                            <button onClick={() => setEditingDevice(null)} className="flex-1 px-4 py-2.5 bg-surface-card text-text-secondary text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-surface-hover transition-all">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
