import { TableStatus } from "@nexus/contracts";

// Status Color Mapping - Premium Gradient Palettes
export const STATUS_COLORS: Record<TableStatus, string> = {
    'free': 'var(--status-table-available)',
    'seated': 'var(--status-table-occupied)',
    'ordered': 'var(--status-order-pending)',
    'eating': 'var(--status-order-ready)',
    'paying': 'var(--action-primary)',
    'dirty': 'var(--status-danger)',
    'reserved': 'var(--status-table-reserved)',
    'cleaning': 'var(--status-table-available)',
    'locked': 'var(--text-muted)',
};
