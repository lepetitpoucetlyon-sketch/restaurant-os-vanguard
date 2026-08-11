/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Printer, Plus, Trash2, Star, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";
import type { PrinterDevice, PrinterRole, PrinterConnection } from "@/modules/ops/service/printers/hardware/types";
import { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS } from "@/modules/ops/service/printers/hardware/types";
import { CONN_ICON, AddPrinterWizard } from '@/modules/ops/service/printers/components/settings/AddPrinterWizard';

const ROLE_COLORS: Record<PrinterRole, string> = {
  receipt: "text-status-success",
  kitchen: "text-orange-500",
  bar:     "text-sky-500",
  label:   "text-purple-500",
};

type TestStatus = "idle" | "testing" | "ok" | "error";

export default function PrinterSettings() {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});

  const refresh = useCallback(() => setPrinters(printerService.getAll()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleTest = useCallback(async (printer: PrinterDevice) => {
    setTestStatus(s => ({ ...s, [printer.id]: "testing" }));
    const result = await printerService.testPrint(printer);
    setTestStatus(s => ({ ...s, [printer.id]: result.success ? "ok" : "error" }));
    setTimeout(() => setTestStatus(s => ({ ...s, [printer.id]: "idle" })), 3000);
  }, []);

  const handleRemove = useCallback((id: string) => {
    printerService.remove(id);
    refresh();
  }, [refresh]);

  const handleSetDefault = useCallback((id: string) => {
    printerService.setDefault(id);
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-brand text-text-primary italic">Imprimantes</h2>
          <p className="text-xs text-text-muted mt-0.5">WiFi · Bluetooth · USB · Série · Navigateur</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-primary text-bg-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {printers.length === 0 ? (
        <EmptyState onAdd={() => setShowWizard(true)} />
      ) : (
        <div className="space-y-3">
          {printers.map(p => (
            <PrinterCard
              key={p.id}
              printer={p}
              testStatus={testStatus[p.id] ?? "idle"}
              onTest={() => handleTest(p)}
              onRemove={() => handleRemove(p.id)}
              onSetDefault={() => handleSetDefault(p.id)}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg-secondary p-5">
        <p className="text-xs text-text-muted">
          <span className="text-text-primary font-semibold">Fallback navigateur</span> — si aucune
          imprimante n&apos;est configurée pour un rôle, le système bascule automatiquement sur
          <code className="mx-1 text-action-primary">window.print()</code> (dialogue d&apos;impression du navigateur).
        </p>
      </div>

      {showWizard && (
        <AddPrinterWizard
          onClose={() => setShowWizard(false)}
          onAdded={() => { refresh(); setShowWizard(false); }}
        />
      )}
    </div>
  );
}

function PrinterCard({
  printer, testStatus, onTest, onRemove, onSetDefault,
}: {
  printer: PrinterDevice;
  testStatus: TestStatus;
  onTest(): void;
  onRemove(): void;
  onSetDefault(): void;
}) {
  const connLabel  = CONNECTION_LABELS[printer.connection.type];
  const connDetail = getConnDetail(printer.connection);

  return (
    <div className={`rounded-2xl border p-5 transition-all ${printer.enabled ? "border-border bg-bg-secondary" : "border-border/50 bg-bg-secondary/50 opacity-60"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center shrink-0 ${ROLE_COLORS[printer.role]}`}>
          {CONN_ICON[printer.connection.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{printer.name}</span>
            {printer.isDefault && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-action-primary bg-action-primary/10 border border-action-primary/20 px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5" /> Défaut
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-text-muted">
            <span className={ROLE_COLORS[printer.role]}>{ROLE_LABELS[printer.role]}</span>
            <span>·</span>
            <span>{BRAND_LABELS[printer.brand]}</span>
            <span>·</span>
            <span>{connLabel}</span>
            {connDetail && <><span>·</span><span className="font-mono">{connDetail}</span></>}
            <span>·</span>
            <span>{printer.paperWidth}mm</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!printer.isDefault && (
            <button onClick={onSetDefault} title="Définir par défaut"
              className="w-8 h-8 rounded-lg hover:bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-action-primary transition-colors">
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <TestButton status={testStatus} onClick={onTest} />
          <button onClick={onRemove} title="Supprimer"
            className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TestButton({ status, onClick }: { status: TestStatus; onClick(): void }) {
  const map: Record<TestStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    idle:    { icon: <Printer className="w-3.5 h-3.5" />, label: "Test", cls: "text-text-muted hover:text-action-primary hover:bg-action-primary/10" },
    testing: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: "…", cls: "text-action-primary" },
    ok:      { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "OK", cls: "text-success bg-success/10" },
    error:   { icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Err", cls: "text-danger bg-danger/10" },
  };
  const { icon, label, cls } = map[status];
  return (
    <button onClick={onClick} disabled={status === "testing"} title="Imprimer ticket de test"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cls}`}>
      {icon}{label}
    </button>
  );
}

function getConnDetail(conn: PrinterConnection): string | null {
  if (conn.type === "network")   return `${conn.ip}:${conn.port}`;
  if (conn.type === "bluetooth") return conn.deviceName ?? null;
  if (conn.type === "usb")       return conn.deviceName ?? null;
  if (conn.type === "serial")    return `${conn.baudRate} baud`;
  return null;
}

function EmptyState({ onAdd }: { onAdd(): void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-12 text-center">
      <Printer className="w-10 h-10 text-text-muted mx-auto mb-4" />
      <p className="text-sm font-semibold text-text-primary mb-1">Aucune imprimante configurée</p>
      <p className="text-xs text-text-muted mb-6">L&apos;impression bascule automatiquement sur le navigateur jusqu&apos;à ce qu&apos;une imprimante soit ajoutée.</p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-primary text-bg-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
        <Plus className="w-3.5 h-3.5" />
        Configurer ma première imprimante
      </button>
    </div>
  );
}

export { PrinterSettings };
