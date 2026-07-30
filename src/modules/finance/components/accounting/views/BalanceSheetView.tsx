"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounting } from "../../../hooks/useAccounting";
import { formatMu } from "../../financeUtils";

const fmu = (mu?: number | null, fallbackCents = 0) =>
    formatMu(mu ?? fallbackCents * 10_000);

export function BalanceSheetView() {
    const { generateBalanceSheet, metrics } = useAccounting();
    const bs = useMemo(() => generateBalanceSheet(new Date()), [generateBalanceSheet]);

    return (
        <div className="space-y-6">
            <div className={cn("p-5 rounded-2xl flex items-center gap-4", bs.isBalanced ? "bg-success/5 border border-success/20" : "bg-error/5 border border-error/20")}>
                {bs.isBalanced ? <CheckCircle2 className="w-6 h-6 text-success" /> : <AlertCircle className="w-6 h-6 text-error" />}
                <div>
                    <p className="text-sm font-bold">{bs.isBalanced ? "Bilan Équilibré" : "Déséquilibré"}</p>
                    <p className="text-[10px] text-text-muted">Actif = {fmu(bs.totalAssetsInMicrounits, bs.totalAssetsInCents)} | Passif = {fmu((bs.totalLiabilitiesInMicrounits ?? 0) + (bs.totalEquityInMicrounits ?? 0) || null, bs.totalLiabilitiesInCents + bs.totalEquityInCents)}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="card-premium bg-bg-secondary p-6">
                    <h3 className="font-bold text-text-primary mb-4">Actif</h3>
                    {bs.assets.map((a, i) => (
                        <div key={i} className="flex justify-between py-2"><span className="text-sm">{a.accountCode} {a.accountName}</span><span className="font-mono font-bold">{fmu(a.amountInMicrounits, a.amountInCents)}</span></div>
                    ))}
                    <div className="border-t border-border mt-4 pt-4 flex justify-between font-black text-success"><span>Total Actif</span><span>{fmu(bs.totalAssetsInMicrounits, bs.totalAssetsInCents)}</span></div>
                </div>
                <div className="card-premium bg-bg-secondary p-6">
                    <h3 className="font-bold text-text-primary mb-4">Passif & Capitaux</h3>
                    {bs.liabilities.map((l, i) => (
                        <div key={i} className="flex justify-between py-2"><span className="text-sm">{l.accountCode} {l.accountName}</span><span className="font-mono font-bold">{fmu(l.amountInMicrounits, l.amountInCents)}</span></div>
                    ))}
                    <div className="flex justify-between py-2 bg-accent/5 px-2 rounded mt-2"><span className="text-sm font-bold text-accent">Résultat</span><span className="font-mono font-bold">{fmu(metrics.netProfitInMicrounits, metrics.netProfitInCents)}</span></div>
                    <div className="border-t border-border mt-4 pt-4 flex justify-between font-black text-error"><span>Total Passif</span><span>{fmu((bs.totalLiabilitiesInMicrounits ?? 0) + (bs.totalEquityInMicrounits ?? 0) || null, bs.totalLiabilitiesInCents + bs.totalEquityInCents)}</span></div>
                </div>
            </div>
        </div>
    );
}
