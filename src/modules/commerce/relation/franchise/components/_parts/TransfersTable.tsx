"use client";

import { Package, CheckCircle2 } from 'lucide-react';
import type { InterSiteTransfer } from '@/shared/nexus/contracts/franchise.types';

export function TransfersTable({
    transfers,
    onExecute,
}: {
    transfers: InterSiteTransfer[];
    onExecute: (transfer: InterSiteTransfer) => void;
}) {
    if (transfers.length === 0) {
        return (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border-subtle bg-surface-card space-y-3">
                <Package className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                <p className="text-sm font-bold text-text-primary">Aucun transfert inter-sites récent</p>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                    Vous pouvez rééquilibrer vos stocks d’ingrédients entre vos restaurants en un clic.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border-subtle bg-surface-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-bg-tertiary/40 text-text-secondary text-nano uppercase font-black tracking-wider border-b border-border-subtle">
                        <tr>
                            <th className="px-6 py-4">Réf Transfert</th>
                            <th className="px-6 py-4">Origine</th>
                            <th className="px-6 py-4">Destination</th>
                            <th className="px-6 py-4">Articles</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {transfers.map((transfer) => (
                            <tr key={transfer.id} className="hover:bg-surface-card/60 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-text-primary">{transfer.id}</td>
                                <td className="px-6 py-4 text-text-secondary">{transfer.sourceTenantName}</td>
                                <td className="px-6 py-4 text-text-secondary">{transfer.targetTenantName}</td>
                                <td className="px-6 py-4 text-text-primary">
                                    {transfer.items
                                        .map((it) => `${it.itemName} (${it.quantity} ${it.unit})`)
                                        .join(', ')}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-nano font-bold ${
                                            transfer.status === 'RECEIVED'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-amber-500/10 text-amber-400'
                                        }`}
                                    >
                                        {transfer.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {transfer.status === 'REQUESTED' && (
                                        <button
                                            onClick={() => onExecute(transfer)}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-nano font-bold transition-all flex items-center gap-1.5 ml-auto"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Réceptionner (Stock +)
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
