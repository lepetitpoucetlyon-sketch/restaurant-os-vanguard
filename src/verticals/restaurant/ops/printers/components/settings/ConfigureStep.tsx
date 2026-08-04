"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Bluetooth, Usb } from "lucide-react";
import { scanBluetoothPrinters } from "@/infrastructure/hardware/printers/adapters/BluetoothAdapter";
import { requestUSBPrinter } from "@/infrastructure/hardware/printers/adapters/USBAdapter";
import type {
  PrinterDevice, PrinterConnectionType, PaperWidth, PrinterConnection,
} from "@/infrastructure/hardware/printers/types";
import { ROLE_LABELS, BRAND_LABELS } from "@/infrastructure/hardware/printers/types";
import { useNotifications } from "@/shared/contexts/NotificationsContext";

export const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-action-primary transition-colors";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</label>
      {children}
    </div>
  );
}

export function ConfigureStep({
  draft, onChange, onSave,
}: {
  draft: Partial<PrinterDevice>;
  onChange(p: Partial<PrinterDevice>): void;
  onSave(conn: PrinterConnection, name: string): void;
}) {
  const [name, setName]    = useState(`${ROLE_LABELS[draft.role ?? "receipt"]} — ${BRAND_LABELS[draft.brand ?? "generic"]}`);
  const [ip, setIp]        = useState("192.168.1.100");
  const [port, setPort]    = useState(9100);
  const [protocol, setPro] = useState<"raw" | "epos-http">("raw");
  const [btDevice, setBtDevice]   = useState<{ id: string; name: string } | null>(null);
  const [usbDevice, setUsbDevice] = useState<{ vendorId: number; productId: number; deviceName?: string } | null>(null);
  const [baud, setBaud]    = useState<9600 | 19200 | 38400 | 115200>(9600);
  const [scanning, setScanning] = useState(false);
  const { addNotification } = useNotifications();

  const connType = (draft.connection as PrinterConnection | undefined)?.type
    ?? (draft as { _connType?: PrinterConnectionType })._connType
    ?? "network";
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
      addNotification({ type: "warning", title: "Bluetooth indisponible", message: "Aucune imprimante Bluetooth détectée. Vérifiez les permissions." });
    } finally { setScanning(false); }
  };

  const scanUSB = async () => {
    setScanning(true);
    try {
      const dev = await requestUSBPrinter();
      if (dev) setUsbDevice({ vendorId: dev.vendorId, productId: dev.productId, deviceName: dev.productName });
    } catch (err) {
      console.warn(err);
      addNotification({ type: "warning", title: "USB indisponible", message: "Aucune imprimante USB sélectionnée. Vérifiez la connexion." });
    } finally { setScanning(false); }
  };

  const paperWidths: PaperWidth[] = [58, 72, 80];

  return (
    <div className="space-y-5">
      <Field label="Nom affiché">
        <input value={name} onChange={e => setName(e.target.value)} className={INPUT_CLS} />
      </Field>

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
