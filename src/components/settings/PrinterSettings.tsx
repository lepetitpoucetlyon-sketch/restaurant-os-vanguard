"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Printer, Plus, Trash2, Wifi, Bluetooth, Usb, Cable, Monitor,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Star, Settings2,
} from "lucide-react";
import { printerService } from "@/lib/printing/PrintingService";
import { isBluetoothSupported, scanBluetoothPrinters } from "@/lib/printing/adapters/BluetoothAdapter";
import { isUSBSupported, requestUSBPrinter } from "@/lib/printing/adapters/USBAdapter";
import { isSerialSupported, requestSerialPrinter } from "@/lib/printing/adapters/SerialAdapter";
import type {
  PrinterDevice, PrinterBrand, PrinterRole, PrinterConnectionType,
  PaperWidth, PrinterConnection,
} from "@/lib/printing/types";
import { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS } from "@/lib/printing/types";
import { useNotifications } from '@/context/NotificationsContext';

// ─── Icons per connection type ─────────────────────────────────────────────

const CONN_ICON: Record<PrinterConnectionType, React.ReactNode> = {
  network:   <Wifi className="w-4 h-4" />,
  bluetooth: <Bluetooth className="w-4 h-4" />,
  usb:       <Usb className="w-4 h-4" />,
  serial:    <Cable className="w-4 h-4" />,
  browser:   <Monitor className="w-4 h-4" />,
};

const ROLE_COLORS: Record<PrinterRole, string> = {
  receipt: "text-emerald-500",
  kitchen: "text-orange-500",
  bar:     "text-sky-500",
  label:   "text-purple-500",
};

type WizardStep = "role" | "brand" | "connection" | "configure";
type TestStatus = "idle" | "testing" | "ok" | "error";

// ─── Main Component ────────────────────────────────────────────────────────

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-brand text-text-primary italic">Imprimantes</h2>
          <p className="text-xs text-text-muted mt-0.5">
            WiFi · Bluetooth · USB · Série · Navigateur
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action-primary text-bg-primary text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Printer list */}
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

      {/* Browser fallback note */}
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

// ─── Printer Card ──────────────────────────────────────────────────────────

function PrinterCard({
  printer, testStatus, onTest, onRemove, onSetDefault,
}: {
  printer: PrinterDevice;
  testStatus: TestStatus;
  onTest(): void;
  onRemove(): void;
  onSetDefault(): void;
}) {
  const connLabel = CONNECTION_LABELS[printer.connection.type];
  const connDetail = getConnDetail(printer.connection);

  return (
    <div className={`rounded-2xl border p-5 transition-all ${printer.enabled ? "border-border bg-bg-secondary" : "border-border/50 bg-bg-secondary/50 opacity-60"}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center shrink-0 ${ROLE_COLORS[printer.role]}`}>
          {CONN_ICON[printer.connection.type]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{printer.name}</span>
            {printer.isDefault && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
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

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!printer.isDefault && (
            <button
              onClick={onSetDefault}
              title="Définir par défaut"
              className="w-8 h-8 rounded-lg hover:bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-amber-500 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <TestButton status={testStatus} onClick={onTest} />
          <button
            onClick={onRemove}
            title="Supprimer"
            className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
          >
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
    <button
      onClick={onClick}
      disabled={status === "testing"}
      title="Imprimer ticket de test"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cls}`}
    >
      {icon}{label}
    </button>
  );
}

function getConnDetail(conn: PrinterConnection): string | null {
  if (conn.type === "network") return `${conn.ip}:${conn.port}`;
  if (conn.type === "bluetooth") return conn.deviceName ?? null;
  if (conn.type === "usb") return conn.deviceName ?? null;
  if (conn.type === "serial") return `${conn.baudRate} baud`;
  return null;
}

// ─── Add Printer Wizard ────────────────────────────────────────────────────

function AddPrinterWizard({ onClose, onAdded }: { onClose(): void; onAdded(): void }) {
  const [step, setStep] = useState<WizardStep>("role");
  const [draft, setDraft] = useState<Partial<PrinterDevice>>({
    paperWidth: 80, hasCutter: true, enabled: true, isDefault: false,
  });

  const next = (patch: Partial<PrinterDevice>, nextStep: WizardStep) => {
    setDraft(d => ({ ...d, ...patch }));
    setStep(nextStep);
  };

  const save = (finalConn: PrinterConnection, name: string) => {
    const device = printerService.add({
      name,
      brand: draft.brand ?? "generic",
      role: draft.role ?? "receipt",
      connection: finalConn,
      paperWidth: draft.paperWidth ?? 80,
      hasCutter: draft.hasCutter ?? true,
      enabled: true,
      isDefault: false,
    });
    void printerService.testPrint(device);
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-bg-secondary border border-border shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-bg-tertiary">
          <div
            className="h-full bg-action-primary transition-all"
            style={{ width: `${{ role: 25, brand: 50, connection: 75, configure: 100 }[step]}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-action-primary/10 flex items-center justify-center">
              <Settings2 className="w-4.5 h-4.5 text-action-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Nouvelle imprimante</h3>
              <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
                {{ role: "Étape 1/4 — Rôle", brand: "Étape 2/4 — Marque", connection: "Étape 3/4 — Connexion", configure: "Étape 4/4 — Configuration" }[step]}
              </p>
            </div>
            <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary text-xl leading-none">&times;</button>
          </div>

          {step === "role" && <RoleStep onNext={role => next({ role }, "brand")} />}
          {step === "brand" && <BrandStep onNext={brand => next({ brand }, "connection")} />}
          {step === "connection" && <ConnectionStep onNext={type => next({}, "configure")} brand={draft.brand ?? "generic"} />}
          {step === "configure" && (
            <ConfigureStep
              draft={draft}
              onChange={patch => setDraft(d => ({ ...d, ...patch }))}
              onSave={save}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RoleStep({ onNext }: { onNext(r: PrinterRole): void }) {
  const roles: { role: PrinterRole; emoji: string; desc: string }[] = [
    { role: "receipt", emoji: "🧾", desc: "Ticket caisse — impression client" },
    { role: "kitchen", emoji: "🍳", desc: "Bon cuisine / KDS backup" },
    { role: "bar",     emoji: "🍹", desc: "Bon bar & boissons" },
    { role: "label",   emoji: "🏷️", desc: "Étiquettes produits / DLC" },
  ];
  return (
    <div className="space-y-2">
      {roles.map(({ role, emoji, desc }) => (
        <button key={role} onClick={() => onNext(role)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-action-primary hover:bg-action-primary/5 transition-all group text-left">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="text-sm font-semibold text-text-primary">{ROLE_LABELS[role]}</div>
            <div className="text-xs text-text-muted">{desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-action-primary" />
        </button>
      ))}
    </div>
  );
}

function BrandStep({ onNext }: { onNext(b: PrinterBrand): void }) {
  const brands: { brand: PrinterBrand; models: string }[] = [
    { brand: "epson",   models: "TM-T20, TM-T88VI, TM-T70, TM-m30II" },
    { brand: "star",    models: "TSP100IV, TSP654II, mPOP, SM-L200" },
    { brand: "bixolon", models: "SRP-350III, SPP-R310, SRP-S300" },
    { brand: "citizen", models: "CT-S310II, CT-S601, CL-S521" },
    { brand: "generic", models: "Tout imprimante ESC/POS compatible" },
  ];
  return (
    <div className="space-y-2">
      {brands.map(({ brand, models }) => (
        <button key={brand} onClick={() => onNext(brand)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-action-primary hover:bg-action-primary/5 transition-all group text-left">
          <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
            <Printer className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{BRAND_LABELS[brand]}</div>
            <div className="text-xs text-text-muted">{models}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-action-primary" />
        </button>
      ))}
    </div>
  );
}

function ConnectionStep({ onNext, brand }: { onNext(t: PrinterConnectionType): void; brand: PrinterBrand }) {
  const btOk  = isBluetoothSupported();
  const usbOk = isUSBSupported();
  const serOk = isSerialSupported();

  const options: { type: PrinterConnectionType; available: boolean; note?: string }[] = [
    { type: "network",   available: true },
    { type: "bluetooth", available: btOk,  note: btOk  ? undefined : "Chrome 56+ requis (HTTPS)" },
    { type: "usb",       available: usbOk, note: usbOk ? undefined : "Chrome 61+ requis (HTTPS)" },
    { type: "serial",    available: serOk, note: serOk ? undefined : "Chrome 89+ requis (HTTPS)" },
    { type: "browser",   available: true,  note: "Secours — dialogue d'impression navigateur" },
  ];

  return (
    <div className="space-y-2">
      {options.map(({ type, available, note }) => (
        <button key={type} onClick={() => available && onNext(type)} disabled={!available}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group text-left
            ${available ? "border-border hover:border-action-primary hover:bg-action-primary/5" : "border-border/30 opacity-40 cursor-not-allowed"}`}>
          <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted">
            {CONN_ICON[type]}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{CONNECTION_LABELS[type]}</div>
            {note && <div className="text-xs text-text-muted">{note}</div>}
          </div>
          {available && <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-action-primary" />}
        </button>
      ))}
    </div>
  );
}

function ConfigureStep({
  draft, onChange, onSave,
}: {
  draft: Partial<PrinterDevice>;
  onChange(p: Partial<PrinterDevice>): void;
  onSave(conn: PrinterConnection, name: string): void;
}) {
  const [name, setName]   = useState(`${ROLE_LABELS[draft.role ?? "receipt"]} — ${BRAND_LABELS[draft.brand ?? "generic"]}`);
  const [ip, setIp]       = useState("192.168.1.100");
  const [port, setPort]   = useState(9100);
  const [protocol, setPro] = useState<"raw" | "epos-http">("raw");
  const [btDevice, setBtDevice] = useState<{ id: string; name: string } | null>(null);
  const [usbDevice, setUsbDevice] = useState<{ vendorId: number; productId: number; deviceName?: string } | null>(null);
  const [baud, setBaud]   = useState<9600 | 19200 | 38400 | 115200>(9600);
  const [scanning, setScanning] = useState(false);
  const { addNotification } = useNotifications();
  const connType = (draft.connection as PrinterConnection | undefined)?.type
    ?? (draft as { _connType?: PrinterConnectionType })._connType
    ?? "network";

  // Derive connection type from wizard flow — stored temporarily
  const [selectedConnType] = useState<PrinterConnectionType>(connType);

  const buildConn = (): PrinterConnection => {
    switch (selectedConnType) {
      case "network":   return { type: "network", ip, port, protocol };
      case "bluetooth": return { type: "bluetooth", deviceId: btDevice?.id, deviceName: btDevice?.name };
      case "usb":       return { type: "usb", vendorId: usbDevice?.vendorId, productId: usbDevice?.productId, deviceName: usbDevice?.deviceName };
      case "serial":    return { type: "serial", baudRate: baud };
      default:          return { type: "browser" };
    }
  };

  const scanBT = async () => {
    setScanning(true);
    try {
      const dev = await scanBluetoothPrinters(draft.brand ?? "generic");
      if (dev) setBtDevice({ id: dev.id, name: dev.name ?? dev.id });
    } catch (err) {
      console.warn(err);
      addNotification({ type: 'warning', title: 'Bluetooth indisponible', message: 'Aucune imprimante Bluetooth détectée. Vérifiez les permissions.' });
    } finally { setScanning(false); }
  };

  const scanUSB = async () => {
    setScanning(true);
    try {
      const dev = await requestUSBPrinter();
      if (dev) setUsbDevice({ vendorId: dev.vendorId, productId: dev.productId, deviceName: dev.productName });
    } catch (err) {
      console.warn(err);
      addNotification({ type: 'warning', title: 'USB indisponible', message: 'Aucune imprimante USB sélectionnée. Vérifiez la connexion.' });
    } finally { setScanning(false); }
  };

  const paperWidths: PaperWidth[] = [58, 72, 80];

  return (
    <div className="space-y-5">
      {/* Name */}
      <Field label="Nom affiché">
        <input value={name} onChange={e => setName(e.target.value)} className={INPUT_CLS} />
      </Field>

      {/* Connection-specific fields */}
      {selectedConnType === "network" && (
        <>
          <Field label="Adresse IP">
            <input value={ip} onChange={e => setIp(e.target.value)} className={INPUT_CLS} placeholder="192.168.1.100" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Port">
              <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} className={INPUT_CLS} />
            </Field>
            <Field label="Protocole">
              <select value={protocol} onChange={e => setPro(e.target.value as "raw" | "epos-http")} className={INPUT_CLS}>
                <option value="raw">RAW TCP (9100)</option>
                <option value="epos-http">Epson ePOS HTTP (8008)</option>
              </select>
            </Field>
          </div>
        </>
      )}

      {selectedConnType === "bluetooth" && (
        <Field label="Périphérique Bluetooth">
          {btDevice ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-text-primary">{btDevice.name}</span>
            </div>
          ) : (
            <button onClick={scanBT} disabled={scanning}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-action-primary text-sm text-text-muted hover:text-action-primary transition-colors">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
              {scanning ? "Recherche…" : "Scanner les imprimantes Bluetooth"}
            </button>
          )}
        </Field>
      )}

      {selectedConnType === "usb" && (
        <Field label="Périphérique USB">
          {usbDevice ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-text-primary">{usbDevice.deviceName ?? `VID:${usbDevice.vendorId} PID:${usbDevice.productId}`}</span>
            </div>
          ) : (
            <button onClick={scanUSB} disabled={scanning}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-action-primary text-sm text-text-muted hover:text-action-primary transition-colors">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4" />}
              {scanning ? "Recherche…" : "Sélectionner imprimante USB"}
            </button>
          )}
        </Field>
      )}

      {selectedConnType === "serial" && (
        <Field label="Vitesse (baud rate)">
          <select value={baud} onChange={e => setBaud(Number(e.target.value) as typeof baud)} className={INPUT_CLS}>
            {([9600, 19200, 38400, 115200] as const).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
      )}

      {/* Paper width + cutter */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Largeur papier">
          <div className="flex gap-2">
            {paperWidths.map(w => (
              <button key={w} onClick={() => onChange({ paperWidth: w })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors
                  ${draft.paperWidth === w ? "bg-action-primary text-bg-primary border-action-primary" : "border-border text-text-muted hover:border-action-primary"}`}>
                {w}mm
              </button>
            ))}
          </div>
        </Field>
        <Field label="Coupe-papier">
          <button onClick={() => onChange({ hasCutter: !draft.hasCutter })}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-colors
              ${draft.hasCutter ? "bg-success/10 border-success/30 text-success" : "border-border text-text-muted"}`}>
            {draft.hasCutter ? "✓ Activé" : "Désactivé"}
          </button>
        </Field>
      </div>

      {/* Save button */}
      <button
        onClick={() => onSave(buildConn(), name)}
        disabled={selectedConnType === "bluetooth" && !btDevice}
        className="w-full py-3 rounded-xl bg-action-primary text-bg-primary text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        Ajouter et tester
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</label>
      {children}
    </div>
  );
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

const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-action-primary transition-colors";

export { PrinterSettings };
