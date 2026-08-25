"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Printer, Plus, Trash2, Star, CheckCircle2, AlertCircle, Loader2,
  Sparkles, QrCode, Sliders, Palette
} from "lucide-react";
import { printerService } from "@/modules/ops";
import type { PrinterDevice, PrinterRole, PrinterConnection, TicketStyle, ReceiptConfig } from "@/modules/ops";
import { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS, CONN_ICON, AddPrinterWizard } from "@/modules/ops";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import { useTenant } from "@/shared/providers/NexusCoreProvider";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { toast } from "sonner";

const ROLE_COLORS: Record<PrinterRole, string> = {
  receipt: "text-status-success",
  kitchen: "text-orange-500",
  bar:     "text-sky-500",
  label:   "text-purple-500",
};

type TestStatus = "idle" | "testing" | "ok" | "error";

export default function PrinterSettings() {
  const { activeTenantConfig } = useTenant();
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});

  // Receipt Design State
  const [receiptStyle, setReceiptStyle] = useState<TicketStyle>("classic");
  const [qrCodeType, setQrCodeType] = useState<"eticket" | "google_review" | "loyalty" | "custom">("eticket");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [customQrUrl, setCustomQrUrl] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [isSavingDesign, setIsSavingDesign] = useState(false);

  const refresh = useCallback(() => setPrinters(printerService.getAll()), []);
  
  useEffect(() => {
    refresh();
    // Charger la configuration de ticket existante
    const existingConfig = (activeTenantConfig as { receiptConfig?: ReceiptConfig } | null)?.receiptConfig;
    if (existingConfig) {
      if (existingConfig.ticketStyle) setReceiptStyle(existingConfig.ticketStyle);
      if (existingConfig.qrCodeType) setQrCodeType(existingConfig.qrCodeType);
      if (existingConfig.googleReviewUrl) setGoogleReviewUrl(existingConfig.googleReviewUrl);
      if (existingConfig.qrCodeCustomUrl) setCustomQrUrl(existingConfig.qrCodeCustomUrl);
      if (existingConfig.customFooterNote) setFooterNote(existingConfig.customFooterNote);
    } else {
      try {
        const local = localStorage.getItem(tenantScopedKey("receipt_config"));
        if (local) {
          const parsed = JSON.parse(local) as ReceiptConfig;
          if (parsed.ticketStyle) setReceiptStyle(parsed.ticketStyle);
          if (parsed.qrCodeType) setQrCodeType(parsed.qrCodeType);
          if (parsed.googleReviewUrl) setGoogleReviewUrl(parsed.googleReviewUrl);
          if (parsed.qrCodeCustomUrl) setCustomQrUrl(parsed.qrCodeCustomUrl);
          if (parsed.customFooterNote) setFooterNote(parsed.customFooterNote);
        }
      } catch { /* ignore */ }
    }
  }, [refresh, activeTenantConfig]);

  const handleSaveReceiptDesign = async () => {
    setIsSavingDesign(true);
    const newConfig: ReceiptConfig = {
      ticketStyle: receiptStyle,
      qrCodeType,
      googleReviewUrl: googleReviewUrl.trim() || undefined,
      qrCodeCustomUrl: customQrUrl.trim() || undefined,
      customFooterNote: footerNote.trim() || undefined,
      showLogo: true,
    };

    try {
      localStorage.setItem(tenantScopedKey("receipt_config"), JSON.stringify(newConfig));
      if (activeTenantConfig?.id) {
        await Nexus.adapter.update(`tenants/${activeTenantConfig.id}/tenantConfig`, {
          receiptConfig: newConfig,
        });
      }
      toast.success("Design du ticket de caisse enregistré !");
    } catch {
      toast.error("Erreur lors de l'enregistrement du design");
    } finally {
      setIsSavingDesign(false);
    }
  };

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
    <div className="space-y-8">
      {/* 1. Header & Matériel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-brand text-text-primary italic">Imprimantes & Tickets</h2>
          <p className="text-xs text-text-muted mt-0.5">Matériel thermique · Styles de tickets · QR Codes</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-primary text-bg-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter Imprimante
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

      {/* 2. Personnalisation Visuelle du Ticket (V3-PRINT-STYLE) */}
      <div className="rounded-3xl border border-border bg-bg-secondary p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Design & Style du Ticket de Caisse</h3>
              <p className="text-xs text-text-muted">Choisissez l&apos;esthétique d&apos;impression et la destination du QR Code</p>
            </div>
          </div>
          <span className="text-nano uppercase tracking-widest font-black text-status-success bg-status-success/10 px-2.5 py-1 rounded-full border border-status-success/20">
            Conforme NF525
          </span>
        </div>

        {/* Sélection des 3 Thèmes */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" /> Style Visuel
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StyleOptionCard
              title="Classique"
              desc="Équilibré et net. Séparateurs francs, totaux en relief, très lisible."
              tag="Standardisé"
              selected={receiptStyle === "classic"}
              onClick={() => setReceiptStyle("classic")}
            />
            <StyleOptionCard
              title="Minimaliste"
              desc="Design contemporain épuré. Points légers (·), typographie aérée."
              tag="Moderne"
              selected={receiptStyle === "minimalist"}
              onClick={() => setReceiptStyle("minimalist")}
            />
            <StyleOptionCard
              title="Gourmet"
              desc="Prestige gastronomique. Ornements ✦ ✦ ✦, double cadre et mot du chef."
              tag="Gastronomie"
              selected={receiptStyle === "gourmet"}
              onClick={() => setReceiptStyle("gourmet")}
            />
          </div>
        </div>

        {/* Configuration QR Code */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <QrCode className="w-3.5 h-3.5" /> Destination du QR Code (Pied de Ticket)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: "eticket", label: "📱 e-Ticket & Avis", desc: "Reçu digital + Avis 5★" },
              { id: "google_review", label: "⭐ Avis Google Direct", desc: "Lien fiche Google Maps" },
              { id: "loyalty", label: "🎁 Club Fidélité", desc: "Inscription fidélité" },
              { id: "custom", label: "🔗 Lien Personnalisé", desc: "URL libre de votre choix" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setQrCodeType(opt.id as typeof qrCodeType)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  qrCodeType === opt.id
                    ? "border-action-primary bg-action-primary/10 text-text-primary"
                    : "border-border bg-bg-tertiary/50 text-text-muted hover:border-border-hover"
                }`}
              >
                <p className="text-xs font-bold text-text-primary">{opt.label}</p>
                <p className="text-micro text-text-muted mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {qrCodeType === "google_review" && (
            <div className="pt-2">
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/votre-restaurant/review"
                className="w-full h-10 px-4 rounded-xl border border-border bg-bg-tertiary text-xs text-text-primary focus:outline-none focus:border-action-primary"
              />
            </div>
          )}

          {qrCodeType === "custom" && (
            <div className="pt-2">
              <input
                type="url"
                value={customQrUrl}
                onChange={(e) => setCustomQrUrl(e.target.value)}
                placeholder="https://monrestaurant.fr/menu"
                className="w-full h-10 px-4 rounded-xl border border-border bg-bg-tertiary text-xs text-text-primary focus:outline-none focus:border-action-primary"
              />
            </div>
          )}
        </div>

        {/* Note de pied de page personnalisée */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Message de pied de page (Ex: Code WiFi, Réseaux, Mot du Chef)
          </label>
          <input
            type="text"
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            placeholder="Ex : WiFi : BISTRO2026 · Suivez-nous sur Instagram @monresto"
            className="w-full h-10 px-4 rounded-xl border border-border bg-bg-tertiary text-xs text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveReceiptDesign}
            disabled={isSavingDesign}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-primary text-bg-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSavingDesign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Enregistrer le Design
          </button>
        </div>
      </div>

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

function StyleOptionCard({
  title,
  desc,
  tag,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  tag: string;
  selected: boolean;
  onClick(): void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
        selected
          ? "border-action-primary bg-action-primary/5 ring-2 ring-action-primary/20"
          : "border-border bg-bg-tertiary/40 hover:border-border-hover"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-text-primary">{title}</span>
        <span className="text-nano uppercase font-black tracking-widest text-text-muted bg-bg-secondary px-2 py-0.5 rounded-md border border-border">
          {tag}
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
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
              <span className="inline-flex items-center gap-1 text-chip-label-sm text-action-primary bg-action-primary/10 border border-action-primary/20 px-2 py-0.5 rounded-full">
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
