// components removed from barrel: internal to POS UI pages/panels
export * from './domain';
export * from './store';
export * from './hooks';

// Infrastructure hardware (cash drawer, payment terminal) — exposée pour settings + ui commerce
export { terminalService } from './infrastructure/payment-terminal/PaymentTerminalService';
export type {
  TerminalDevice,
  TerminalStatus,
  TerminalConnectionType,
  TerminalAdapterType,
} from './infrastructure/payment-terminal/types';
