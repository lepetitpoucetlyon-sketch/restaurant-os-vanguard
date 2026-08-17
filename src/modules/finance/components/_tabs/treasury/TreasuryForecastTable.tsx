"use client";

import { Calendar, FileText } from "lucide-react";
import { microToEur, type CashflowForecast } from "./treasuryTypes";

interface TreasuryForecastTableProps {
  forecasts: CashflowForecast[];
}

export function TreasuryForecastTable({ forecasts }: TreasuryForecastTableProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-status-success/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-status-success" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest">
            Prévisions de trésorerie
          </h3>
          <p className="text-[10px] text-text-muted">
            Basées sur les clôtures Z quotidiennes
          </p>
        </div>
      </div>

      {forecasts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
          <FileText className="w-8 h-8" />
          <p className="text-xs">
            Aucune prévision disponible — effectuez une clôture Z pour générer
            les projections.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted text-left">
                <th className="pb-2 font-black uppercase tracking-widest text-[9px]">
                  Date
                </th>
                <th className="pb-2 font-black uppercase tracking-widest text-[9px] text-right">
                  CA prévu
                </th>
                <th className="pb-2 font-black uppercase tracking-widest text-[9px] text-right">
                  Basé sur
                </th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, i) => (
                <tr key={f.date + i} className="border-b border-border/50">
                  <td className="py-2.5 font-mono">
                    {new Date(f.date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-status-success">
                    {microToEur(f.predictedRevenueInMicrounits)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-text-muted">
                    {f.basedOnRevenue
                      ? microToEur(f.basedOnRevenue)
                      : "—"}
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
