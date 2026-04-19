"use client";
import { useNexusOps } from '@/engines/ops/NexusOpsProvider';
export type { Table, Floor, Zone } from '@/types/tables.types';

/**
 * 🍷 FloorContext (Grade IX)
 * Purged from PMS/Hotel legacy. High-performance proxy to NexusOps floorOps.
 */
export const useFloorOps = () => useNexusOps()?.floorOps;

export const FloorProvider = ({ children }: { children: any }) => <>{children}</>;
