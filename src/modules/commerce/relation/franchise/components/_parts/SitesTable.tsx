"use client";

import { ExternalLink } from 'lucide-react';
import type { FranchiseSiteOverview } from '@/shared/nexus/contracts/franchise.types';

const EUR = { style: 'currency' as const, currency: 'EUR' as const };
const fmtEur = (cents: number) => (cents / 100).toLocaleString('fr-FR', EUR);

export function SitesTable({
    sites,
    currentTenantId,
    onSwitchTenant,
}: {
    sites: FranchiseSiteOverview[];
    currentTenantId: string | undefined;
    onSwitchTenant: (tenantId: string) => void;
}) {
    return (
        <div className="rounded-2xl border border-border-subtle bg-surface-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-bg-tertiary/40 text-text-secondary text-nano uppercase font-black tracking-wider border-b border-border-subtle">
                        <tr>
                            <th className="px-6 py-4">Restaurant</th>
                            <th className="px-6 py-4">Ville</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">CA du Jour</th>
                            <th className="px-6 py-4 text-right">Couverts</th>
                            <th className="px-6 py-4 text-right">Ticket Moyen</th>
                            <th className="px-6 py-4 text-center">Alertes Stock</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {sites.map((site) => (
                            <SiteRow
                                key={site.tenantId}
                                site={site}
                                isCurrent={site.tenantId === currentTenantId}
                                onSwitch={() => onSwitchTenant(site.tenantId)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SiteRow({
    site,
    isCurrent,
    onSwitch,
}: {
    site: FranchiseSiteOverview;
    isCurrent: boolean;
    onSwitch: () => void;
}) {
    return (
        <tr className="hover:bg-surface-card/60 transition-colors">
            <td className="px-6 py-4 font-bold text-text-primary">
                <div className="flex items-center gap-2">
                    <span>{site.name}</span>
                    {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-nano font-black">
                            ACTUEL
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-text-secondary">{site.city}</td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-nano font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {site.status}
                </span>
            </td>
            <td className="px-6 py-4 text-right font-bold text-text-primary">
                {fmtEur(site.todayRevenueInCents)}
            </td>
            <td className="px-6 py-4 text-right text-text-secondary">{site.coversServedCount}</td>
            <td className="px-6 py-4 text-right text-text-secondary">
                {fmtEur(site.averageTicketInCents)}
            </td>
            <td className="px-6 py-4 text-center">
                {site.stockAlertsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold text-nano">
                        {site.stockAlertsCount}
                    </span>
                ) : (
                    <span className="text-emerald-400 text-nano">0</span>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                {!isCurrent ? (
                    <button
                        onClick={onSwitch}
                        className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-brand hover:text-bg-primary border border-border-subtle text-nano font-bold transition-all flex items-center gap-1.5 ml-auto"
                    >
                        Basculer
                        <ExternalLink className="w-3 h-3" />
                    </button>
                ) : (
                    <span className="text-nano text-text-secondary font-medium">Session active</span>
                )}
            </td>
        </tr>
    );
}
