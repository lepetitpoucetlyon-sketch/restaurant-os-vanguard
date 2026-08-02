"use client";
import { useNexusOps } from '@/modules/ops';
export type { Table, Floor, Zone } from '@nexus/contracts';

export const useFloorOps = () => useNexusOps()?.floorOps;

export const FloorProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
