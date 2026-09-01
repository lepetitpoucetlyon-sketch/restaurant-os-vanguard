"use client";

import { useState } from "react";
import { Printer, Wifi, Bluetooth, Usb, Cable, Monitor, ChevronRight, Settings2 } from "lucide-react";
import { printerService } from "../../hardware/PrintingService";
import { isBluetoothSupported } from "../../hardware/adapters/BluetoothAdapter";
import { isUSBSupported } from "../../hardware/adapters/USBAdapter";
import { isSerialSupported } from "../../hardware/adapters/SerialAdapter";
import type {
  PrinterDevice, PrinterBrand, PrinterRole, PrinterConnectionType, PrinterConnection,
} from "../../hardware/types";
import { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS } from "../../hardware/types";
import { ConfigureStep } from "./ConfigureStep";

export const PRINTER_CONN_ICON: Record<PrinterConnectionType, React.ReactNode> = {
  network:   <Wifi className="w-4 h-4" />,
  bluetooth: <Bluetooth className="w-4 h-4" />,
  usb:       <Usb className="w-4 h-4" />,
  serial:    <Cable className="w-4 h-4" />,
  browser:   <Monitor className="w-4 h-4" />,
};

type WizardStep = "role" | "brand" | "connection" | "configure";

export function AddPrinterWizard({ onClose, onAdded }: { onClose(): void; onAdded(): void }) {
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
      role:  draft.role  ?? "receipt",
      connection: finalConn,
      paperWidth: draft.paperWidth ?? 80,
      hasCutter:  draft.hasCutter  ?? true,
      enabled: true,
      isDefault: false,
    });
    void printerService.testPrint(device);
    onAdded();
  };

  const STEP_LABELS: Record<WizardStep, string> = {
    role:      "Étape 1/4 — Rôle",
    brand:     "Étape 2/4 — Marque",
    connection:"Étape 3/4 — Connexion",
    configure: "Étape 4/4 — Configuration",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-bg-secondary border border-border shadow-2xl overflow-hidden">
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
              <p className="text-nano text-text-muted uppercase tracking-widest mt-0.5">{STEP_LABELS[step]}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary text-xl leading-none">&times;</button>
          </div>

          {step === "role"       && <RoleStep onNext={role => next({ role }, "brand")} />}
          {step === "brand"      && <BrandStep onNext={brand => next({ brand }, "connection")} />}
          {step === "connection" && <ConnectionStep onNext={() => next({}, "configure")} brand={draft.brand ?? "generic"} />}
          {step === "configure"  && (
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

function ConnectionStep({ onNext }: { onNext(t: PrinterConnectionType): void; brand: PrinterBrand }) {
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
            {PRINTER_CONN_ICON[type]}
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
