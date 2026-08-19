export * from './components';
export * from './domain';
export * from './store';
export * from './hooks';

// Infrastructure hardware (cash drawer, payment terminal) — exposée pour settings + ui commerce
export * from './infrastructure/cash-drawer/CashDrawerService';
export { terminalService } from './infrastructure/payment-terminal/PaymentTerminalService';
export type {
  TerminalDevice,
  TerminalStatus,
  TerminalConnectionType,
  TerminalAdapterType,
} from './infrastructure/payment-terminal/types';
