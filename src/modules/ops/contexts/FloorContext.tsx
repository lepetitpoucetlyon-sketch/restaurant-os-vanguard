"use client";
import { useNexusOps } from '@/engines/ops/NexusOpsProvider';
export type { Table, Floor, Zone } from '@nexus/contracts';

export const useFloorOps = () => useNexusOps()?.floorOps;

export const FloorProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
