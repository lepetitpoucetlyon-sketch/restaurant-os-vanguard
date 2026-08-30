// @wip owner:ops-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";
import { useNexusOps } from '../../../providers/NexusOpsProvider';
export type { Table, Floor, Zone } from '@nexus/contracts';

export const useFloorOps = () => useNexusOps()?.floorOps;

export const FloorProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
