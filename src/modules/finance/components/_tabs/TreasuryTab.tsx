"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { useTenant } from "@/shared/hooks";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";

import type { CashflowForecast, SupplierInvoice } from "./treasury/treasuryTypes";
import { TreasuryKpis } from "./treasury/TreasuryKpis";
import { TreasurySepaExport } from "./treasury/TreasurySepaExport";
import { TreasuryForecastTable } from "./treasury/TreasuryForecastTable";

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
      <TreasuryKpis
        totalForecast={totalForecast}
        forecasts={forecasts}
        totalPending={totalPending}
        pendingInvoices={pendingInvoices}
        overdueInvoices={overdueInvoices}
      />

      <TreasurySepaExport
        pendingInvoices={pendingInvoices}
        totalPending={totalPending}
        generatingSepa={generatingSepa}
        onGenerateSepa={handleGenerateSepa}
      />

      <TreasuryForecastTable forecasts={forecasts} />
    </section>
  );
}
