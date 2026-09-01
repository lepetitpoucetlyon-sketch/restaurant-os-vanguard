"use client";

import { useState } from "react";
import type { PayrollRow } from "../staffUtils";
import { Download, FileText, Utensils, Moon, Clock, TrendingUp } from "lucide-react";
import { Button } from "@ui/Button";
import { HcrPayrollEngine } from "@/modules/human";
import { useToast } from "@ui/Toast";

interface PayrollTabProps {
    isManager: boolean;
    payrollMonth: string;
    setPayrollMonth: (month: string) => void;
    payrollRows: PayrollRow[];
    onOpenContractModal?: (user: PayrollRow['user']) => void;
}

export function PayrollTab({ isManager, payrollMonth, setPayrollMonth, payrollRows, onOpenContractModal }: PayrollTabProps) {
    const { showToast } = useToast();
    const [selectedUser, setSelectedUser] = useState<PayrollRow | null>(null);

    if (!isManager) {
        return (
            <section className="space-y-6">
                <p className="text-sm text-text-muted italic py-8 text-center">
                    Accès réservé aux managers.
                </p>
            </section>
        );
    }

    const totalGross = payrollRows.reduce((s, r) => s + (r.hcrPayroll?.grossTotalSalaryEur ?? r.grossEur), 0);
    const totalEmployerCost = payrollRows.reduce((s, r) => s + (r.hcrPayroll?.employerCostEstimatedEur ?? (r.grossEur * 1.42)), 0);
    const totalHours = payrollRows.reduce((s, r) => s + r.hours, 0);
    const totalOvertime = payrollRows.reduce((s, r) => s + (r.overtimeHours ?? 0), 0);
    const totalNightHours = payrollRows.reduce((s, r) => s + (r.nightHours ?? 0), 0);
    const totalMeals = payrollRows.reduce((s, r) => s + (r.mealCount ?? 0), 0);

    const handleExportCsv = () => {
        if (payrollRows.length === 0) {
            showToast("Aucune donnée de paie à exporter pour ce mois.", "warning");
            return;
        }
        const payrollData = payrollRows.map(r => r.hcrPayroll).filter(Boolean) as NonNullable<PayrollRow['hcrPayroll']>[];
        const csvContent = HcrPayrollEngine.exportToPrepaieCsv(payrollData);
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `prepaie_hcr_${payrollMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Export pré-paie ${payrollMonth} généré avec succès`, "success");
    };

    return (
        <section className="space-y-6">
            {/* Header & Month Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-serif font-bold tracking-tight text-text-primary">
                        Masse Salariale & Pré-Paie HCR
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                        Convention Collective Nationale HCR (IDCC 1979) — Heures pointées, supp, nuit et repas MG.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={payrollMonth}
                        onChange={e => setPayrollMonth(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-border bg-surface-card dark:bg-bg-secondary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-action-primary"
                    />
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <Download className="w-4 h-4" />
                        Export Silae / PayFit (CSV)
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-action-primary" />
                        Masse Salariale Brute
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalGross)}
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Coût employeur estimé : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalEmployerCost)}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Heures Pointées
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {totalHours.toFixed(1)} h
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Dont {totalOvertime.toFixed(1)} h supp HCR (+10%/+20%/+50%)
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        Heures de Nuit
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {totalNightHours.toFixed(1)} h
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Travail en service nocturne (22h–07h)
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-500" />
                        Repas du Personnel
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {totalMeals} repas
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        MG Repas : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalMeals * 4.15)}
                    </p>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="rounded-2xl border border-border overflow-hidden bg-surface-card dark:bg-bg-secondary">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary/50 border-b border-border text-text-muted text-left text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">{"Salarié"}</th>
                                <th className="px-4 py-3 font-semibold">Contrat HCR</th>
                                <th className="px-4 py-3 font-semibold text-right">Heures Totales</th>
                                <th className="px-4 py-3 font-semibold text-right">H. Supp</th>
                                <th className="px-4 py-3 font-semibold text-right">H. Nuit</th>
                                <th className="px-4 py-3 font-semibold text-right">Repas</th>
                                <th className="px-4 py-3 font-semibold text-right">Taux (€/h)</th>
                                <th className="px-4 py-3 font-semibold text-right">Brut Total HCR</th>
                                <th className="px-4 py-3 font-semibold text-center">Contrat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {payrollRows.map(row => {
                                const hcr = row.hcrPayroll;
                                const contractLabel = row.user.contractType === 'extra_cddu' ? 'Extra CDDU' :
                                    row.user.contractType === 'cdi_35h' ? 'CDI 35h' :
                                    row.user.contractType === 'cdd' ? 'CDD' : 'CDI 39h';

                                return (
                                    <tr key={row.user.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-text-primary">
                                            <div>{row.user.name}</div>
                                            <div className="text-nano text-text-muted capitalize font-normal">{row.user.role}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-nano font-bold uppercase tracking-wider bg-action-primary/10 text-action-primary border border-action-primary/20">
                                                {contractLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                                            {row.hours.toFixed(1)} h
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary">
                                            {(row.overtimeHours ?? 0) > 0 ? `+${row.overtimeHours?.toFixed(1)} h` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary">
                                            {(row.nightHours ?? 0) > 0 ? `${row.nightHours?.toFixed(1)} h` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary">
                                            {(row.mealCount ?? 0) > 0 ? `${row.mealCount} MG` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums text-text-muted">
                                            {row.hourlyRateEur.toFixed(2)} €
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-text-primary tabular-nums text-base">
                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(hcr?.grossTotalSalaryEur ?? row.grossEur)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onOpenContractModal?.(row.user)}
                                                className="p-1.5 rounded-lg text-text-muted hover:text-action-primary hover:bg-action-primary/10 transition-colors"
                                                title="Générer Contrat de Travail HCR"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {payrollRows.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-text-muted italic">
                                        Aucun pointage salarié enregistré pour le mois {payrollMonth}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-micro text-text-muted">
                Calcul pré-paie conforme Convention Collective HCR (IDCC 1979) : Heures sup (36–39h à +10%, 40–43h à +20%, 44h+ à +50%), Nuit (22h–07h), Repas MG (4,15 € / shift &gt; 5h) et Indemnité congés payés 10% pour les extras CDDU.
            </p>
        </section>
    );
}
