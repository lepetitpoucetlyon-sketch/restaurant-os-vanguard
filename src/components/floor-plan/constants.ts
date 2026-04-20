import { TableStatus } from "@/types";

// Status Color Mapping - Premium Gradient Palettes
export const STATUS_COLORS: Record<TableStatus, string> = {
    'free': '#E9ECEF',
    'seated': '#3B82F6', // Blue
    'ordered': '#F59E0B', // Amber
    'eating': '#10B981', // Green
    'paying': '#8B5CF6', // Purple
    'dirty': '#EF4444', // Red
    'reserved': '#F97316', // Orange
    'cleaning': '#EC4899', // Pink
    'locked': '#6B7280', // Gray
};
