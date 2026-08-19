// Backward-compat re-export. New code → import from '../../hardware/PrintingService'.
export { EpsonPrinter, printerService } from './PrintingService';
export type { ReceiptTicket, KitchenTicket, PrinterDevice } from './types';

export async function printPOSReceipt(ticket: import('./types').ReceiptTicket): Promise<void> {
  const { printerService: svc } = await import('./PrintingService');
  await svc.printReceipt(ticket);
}
