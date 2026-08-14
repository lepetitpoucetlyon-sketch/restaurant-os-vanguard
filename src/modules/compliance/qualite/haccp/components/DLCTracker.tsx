'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, Clock, Package, RefreshCw } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/kernel/hooks';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StockItemRaw {
    id: string;
    name?: string;
    lotNumber?: string;
    expiryTimestamp?: number | string | null;
    locationXYZ?: [number, number, number] | null;
    quantityInStock?: number;
    unit?: string;
}

interface DLCEntry {
    id: string;
    name: string;
    lotNumber: string;
    expiryDate: Date;
    daysLeft: number;
    location: string;
    quantity: string;
    urgency: 'critical' | 'warning' | 'ok';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildCollectionPath(tenantId: string): string {
    return tenantId ? `tenants/${tenantId}/stockItems` : Nexus.getTenantPath('stockItems');
}

function resolveTimestamp(raw: number | string | null | undefined): number | null {
    if (raw == null) return null;
    if (typeof raw === 'number') return raw;
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? null : parsed;
}

function formatLocation(xyz: [number, number, number] | null | undefined): string {
    if (!xyz) return '—';
    return `Zone ${xyz[0]}, Rayon ${xyz[1]}, Niveau ${xyz[2]}`;
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function DLCTracker() {
    const { tenantId } = useTenant();
    const [entries, setEntries] = useState<DLCEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchExpiring = useCallback(async () => {
        setLoading(true);
        try {
            const path = buildCollectionPath(tenantId ?? '');
            const now = Date.now();

            // Query all items — filter client-side (Firestore range queries on nullable fields are tricky)
            const items = await Nexus.adapter.query<StockItemRaw>(path);

            const expiringEntries: DLCEntry[] = [];

            for (const item of items) {
                const ts = resolveTimestamp(item.expiryTimestamp);
                if (ts == null) continue;

                const daysLeft = Math.ceil((ts - now) / (24 * 60 * 60 * 1000));

                // Only show items expiring within 7 days (including already expired)
                if (daysLeft > 7) continue;

                const urgency: DLCEntry['urgency'] =
                    daysLeft <= 0 ? 'critical'
                    : daysLeft <= 3 ? 'critical'
                    : 'warning';

                expiringEntries.push({
                    id: item.id,
                    name: item.name ?? 'Article inconnu',
                    lotNumber: item.lotNumber ?? '—',
                    expiryDate: new Date(ts),
                    daysLeft,
                    location: formatLocation(item.locationXYZ),
                    quantity: item.quantityInStock != null
                        ? `${item.quantityInStock} ${item.unit ?? ''}`
                        : '—',
                    urgency,
                });
            }

            // Sort: most urgent first
            expiringEntries.sort((a, b) => a.daysLeft - b.daysLeft);
            setEntries(expiringEntries);
            setLastRefresh(new Date());
        } catch (err) {
            logger.debug('[DLCTracker] Chargement dates limites de consommation échoué', { tenantId, error: err });
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchExpiring();
    }, [fetchExpiring]);

    const criticalCount = entries.filter(e => e.urgency === 'critical').length;
    const warningCount = entries.filter(e => e.urgency === 'warning').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-text-primary">DLC &amp; Traçabilité</h2>
                    {criticalCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning text-xs font-semibold">
                            <Clock className="w-3 h-3" />
                            {warningCount} à surveiller
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchExpiring}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sidebar text-text-muted hover:text-text-primary text-xs transition-colors disabled:opacity-40"
                    title={`Dernière mise à jour : ${lastRefresh.toLocaleTimeString('fr-FR')}`}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {loading ? (
                <div className="text-sm text-text-muted animate-pulse p-4">Chargement des DLC...</div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-text-muted bg-surface-sidebar rounded-xl border border-border">
                    <Package className="w-8 h-8 opacity-40" />
                    <p className="text-sm">Aucun article n&apos;expire dans les 7 prochains jours</p>
                    <p className="text-xs opacity-60">Dernière vérification : {lastRefresh.toLocaleTimeString('fr-FR')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm border-collapse min-w-[640px]">
                        <thead>
                            <tr className="bg-surface-sidebar text-xs text-text-muted">
                                <th className="px-3 py-2.5 text-left font-medium border-b border-border">Ingrédient</th>
                                <th className="px-3 py-2.5 text-left font-medium border-b border-border">N° Lot</th>
                                <th className="px-3 py-2.5 text-left font-medium border-b border-border">Date d&apos;expiration</th>
                                <th className="px-3 py-2.5 text-left font-medium border-b border-border">Emplacement</th>
                                <th className="px-3 py-2.5 text-left font-medium border-b border-border">Quantité</th>
                                <th className="px-3 py-2.5 text-center font-medium border-b border-border">Délai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr
                                    key={entry.id}
                                    className={`border-b border-border/50 ${
                                        entry.urgency === 'critical'
                                            ? 'bg-status-danger/5'
                                            : 'bg-status-warning/5'
                                    }`}
                                >
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    entry.urgency === 'critical' ? 'bg-status-danger' : 'bg-status-warning'
                                                }`}
                                            />
                                            <span className="font-medium text-text-primary">{entry.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-text-muted font-mono text-xs">{entry.lotNumber}</td>
                                    <td className="px-3 py-2.5">
                                        <span
                                            className={`font-medium ${
                                                entry.urgency === 'critical' ? 'text-status-danger' : 'text-status-warning'
                                            }`}
                                        >
                                            {entry.expiryDate.toLocaleDateString('fr-FR')}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-text-muted text-xs">{entry.location}</td>
                                    <td className="px-3 py-2.5 text-text-muted">{entry.quantity}</td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                entry.daysLeft <= 0
                                                    ? 'bg-status-danger text-text-primary'
                                                    : entry.urgency === 'critical'
                                                    ? 'bg-status-danger/20 text-status-danger'
                                                    : 'bg-status-warning/20 text-status-warning'
                                            }`}
                                        >
                                            {entry.daysLeft <= 0
                                                ? 'EXPIRÉ'
                                                : `J-${entry.daysLeft}`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
