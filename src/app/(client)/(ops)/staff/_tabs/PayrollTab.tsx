"use client";

import type { PayrollRow } from "../staffUtils";

interface PayrollTabProps {
    isManager: boolean;
    payrollMonth: string;
    setPayrollMonth: (month: string) => void;
    payrollRows: PayrollRow[];
}

export function PayrollTab({ isManager, payrollMonth, setPayrollMonth, payrollRows }: PayrollTabProps) {
    if (!isManager) {
        return (
            <section className="space-y-6">
                <p className="text-sm text-text-muted italic py-8 text-center">
                    Accès réservé aux managers.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold">Salaires estimés</h2>
                <input
                    type="month"
                    value={payrollMonth}
                    onChange={e => setPayrollMonth(e.target.value)}
                    className="px-3 py-1.5 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                />
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-surface-sidebar text-text-muted text-left">
                        <tr>
                            <th className="px-4 py-2.5 font-medium">Employé</th>
                            <th className="px-4 py-2.5 font-medium">Rôle</th>
                            <th className="px-4 py-2.5 font-medium text-right">Heures</th>
                            <th className="px-4 py-2.5 font-medium text-right">Taux (€/h)</th>
                            <th className="px-4 py-2.5 font-medium text-right">Brut estimé</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollRows.map(row => (
                            <tr key={row.user.id} className="border-t border-border hover:bg-surface-hover">
                                <td className="px-4 py-2.5 font-medium">
                                    {row.user.name}
                                </td>
                                <td className="px-4 py-2.5 text-text-muted capitalize">
                                    {row.user.role}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums">
                                    {row.hours.toFixed(1)} h
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-text-muted">
                                    {row.hourlyRateEur > 0 ? `${row.hourlyRateEur.toFixed(2)} €` : "—"}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                                    {row.grossEur > 0
                                        ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.grossEur)
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                        {payrollRows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">
                                    Aucune donnée de pointage pour {payrollMonth}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {payrollRows.length > 0 && (
                        <tfoot className="bg-surface-sidebar border-t border-border">
                            <tr>
                                <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-text-muted">
                                    Total masse salariale brute
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-black text-text-primary">
                                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                                        payrollRows.reduce((s, r) => s + r.grossEur, 0)
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <p className="text-micro text-text-muted">
                Estimation brute — ne tient pas compte des pauses, des heures supp différenciées (36–43h +25%, 44h+ +50%), des primes HCR ni des absences. Utiliser PrepaieBuilder pour l&apos;export officiel.
            </p>
        </section>
    );
}
