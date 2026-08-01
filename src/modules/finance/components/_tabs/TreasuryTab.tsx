"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpDown,
  Download,
  FileText,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { useTenant } from "@/shared/hooks";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";

interface CashflowForecast {
  id?: string;
  date: string;
  predictedRevenueInMicrounits: number;
  basedOnRevenue?: number;
  updatedAt?: number;
}

interface SupplierInvoice {
  id: string;
  supplierName: string;
  amountInMicrounits: number;
  dueDate: string;
  status: "pending" | "approved" | "paid" | "overdue";
  iban?: string;
  bic?: string;
}

function microToEur(µ: number): string {
  return (µ / 1_000_000).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

export function TreasuryTab() {
  const { activeTenantId } = useTenant();
  const [forecasts, setForecasts] = useState<CashflowForecast[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSepa, setGeneratingSepa] = useState(false);

  useEffect(() => {
    if (!activeTenantId) return;
    let cancelled = false;

    async function load() {
      try {
        const [fc, inv] = await Promise.all([
          Nexus.adapter.query<CashflowForecast>(
            `tenants/${activeTenantId}/finance/forecasts`
          ),
          Nexus.adapter.query<SupplierInvoice>(
            `tenants/${activeTenantId}/supplierInvoices`
          ),
        ]);
        if (cancelled) return;
        setForecasts(fc.sort((a, b) => a.date.localeCompare(b.date)));
        setInvoices(inv);
      } catch (err) {
        console.error("[TreasuryTab] load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTenantId]);

  const totalForecast = useMemo(
    () => forecasts.reduce((s, f) => s + f.predictedRevenueInMicrounits, 0),
    [forecasts]
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((i) => i.status === "approved"),
    [invoices]
  );

  const totalPending = useMemo(
    () => pendingInvoices.reduce((s, i) => s + i.amountInMicrounits, 0),
    [pendingInvoices]
  );

  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === "overdue"),
    [invoices]
  );

  const handleGenerateSepa = useCallback(async () => {
    if (!activeTenantId || pendingInvoices.length === 0) return;
    setGeneratingSepa(true);

    try {
      const { SepaFileGenerator } = await import(
        "@/modules/finance/tresorerie/ap/SepaFileGenerator"
      );

      const settings = await Nexus.adapter.get<{
        name?: string;
        iban?: string;
        bic?: string;
      }>(`tenants/${activeTenantId}/settings/accounting`);

      if (!settings?.iban) {
        toast.error("IBAN manquant dans les paramètres comptables.");
        return;
      }

      const xml = SepaFileGenerator.generatePain001({
        initiatorName: settings.name ?? "Restaurant",
        initiatorIban: settings.iban,
        initiatorBic: settings.bic ?? "BNPAFRPP",
        requestedExecutionDate: new Date().toISOString().split("T")[0],
        payments: pendingInvoices.map((inv) => ({
          endToEndId: inv.id,
          creditorName: inv.supplierName,
          creditorIban: inv.iban ?? "",
          creditorBic: inv.bic,
          amountEurCents: Math.round(inv.amountInMicrounits / 10_000),
          remittanceInfo: `Facture ${inv.id}`,
        })),
      });

      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sepa_${new Date().toISOString().split("T")[0]}.xml`;
      a.click();
      URL.revokeObjectURL(url);

      const batchId = `batch_${Date.now()}`;
      await NexusEventBus.emitDurable("finance.payment_dispatched", {
        v: 1,
        tenantId: activeTenantId,
        paymentBatchId: batchId,
        totalAmountInMicrounits: totalPending,
        dispatchedBy: "treasury-ui",
      });

      for (const inv of pendingInvoices) {
        await Nexus.adapter.update(
          `tenants/${activeTenantId}/supplierInvoices/${inv.id}`,
          { status: "paid", paidAt: Date.now(), sepaBatchId: batchId }
        );
      }

      setInvoices((prev) =>
        prev.map((i) =>
          pendingInvoices.some((p) => p.id === i.id)
            ? { ...i, status: "paid" as const }
            : i
        )
      );

      toast.success(
        `Fichier SEPA généré — ${pendingInvoices.length} paiement(s)`
      );
    } catch (err) {
      console.error("[TreasuryTab] SEPA generation failed", err);
      toast.error("Erreur lors de la génération SEPA.");
    } finally {
      setGeneratingSepa(false);
    }
  }, [activeTenantId, pendingInvoices, totalPending]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-action-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Prévision CA (7j)
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-status-success">
            {microToEur(totalForecast)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            {forecasts.length} jour(s) de prévision
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Fournisseurs à payer
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-action-primary">
            {microToEur(totalPending)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            {pendingInvoices.length} facture(s) approuvée(s)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              En retard
            </span>
          </div>
          <p
            className={cn(
              "text-2xl font-serif font-bold",
              overdueInvoices.length > 0
                ? "text-status-error"
                : "text-status-success"
            )}
          >
            {overdueInvoices.length}
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            facture(s) en souffrance
          </p>
        </div>
      </div>

      {/* SEPA Export Section */}
      <div className="rounded-xl border border-border bg-surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-action-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-action-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">
                Virements SEPA
              </h3>
              <p className="text-[10px] text-text-muted">
                Générer un fichier pain.001.001.03 pour les factures approuvées
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateSepa}
            disabled={generatingSepa || pendingInvoices.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-action-primary text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingSepa ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Générer SEPA ({pendingInvoices.length})
          </button>
        </div>

        {pendingInvoices.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            Aucune facture approuvée en attente de paiement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
                  <th className="pb-2 font-black uppercase tracking-widest text-[9px]">
                    Fournisseur
                  </th>
                  <th className="pb-2 font-black uppercase tracking-widest text-[9px]">
                    Échéance
                  </th>
                  <th className="pb-2 font-black uppercase tracking-widest text-[9px] text-right">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50">
                    <td className="py-2.5 font-medium">{inv.supplierName}</td>
                    <td className="py-2.5 font-mono text-text-muted">
                      {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      {microToEur(inv.amountInMicrounits)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="pt-3" colSpan={2}>
                    Total
                  </td>
                  <td className="pt-3 text-right font-mono">
                    {microToEur(totalPending)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Cashflow Forecast Table */}
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
    </section>
  );
}
