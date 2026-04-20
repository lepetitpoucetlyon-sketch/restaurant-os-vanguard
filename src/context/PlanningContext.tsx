"use client";
import { useNexusOps } from '@/engines/ops/NexusOpsProvider';
import { Shift as DomainShift } from '@/types/staff.types';

export type Shift = DomainShift;

export const usePlanning = () => useNexusOps()?.planning;
export const PlanningProvider = ({ children }: { children: any }) => <>{children}</>;
