/**
 * Barrel du module printers — expose la surface publique consommée par
 * les pages App Router et les autres modules ops.
 * Consolidé pour supprimer les imports profonds @/modules/ops/service/core/printing/hardware/*.
 */

// Service principal + moteur
export { printerService, EpsonPrinter } from './hardware/PrintingService';

// Adapters de découverte device
export { isBluetoothSupported, scanBluetoothPrinters } from './hardware/adapters/BluetoothAdapter';
export { isUSBSupported, requestUSBPrinter } from './hardware/adapters/USBAdapter';
export { isSerialSupported } from './hardware/adapters/SerialAdapter';

// Types + labels
export type {
  PrinterDevice,
  PrinterBrand,
  PrinterRole,
  PrinterConnectionType,
  PrinterConnection,
  PaperWidth,
  ReceiptTicket,
  KitchenTicket,
  TicketStyle,
  BitmapImage,
  ReceiptConfig,
} from './hardware/types';
export { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS } from './hardware/types';
