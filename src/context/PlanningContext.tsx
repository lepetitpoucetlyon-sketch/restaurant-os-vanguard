"use client";
import { useNexusOps } from '@/engines/ops/NexusOpsProvider';
export const usePlanning = () => useNexusOps()?.planning;
export const PlanningProvider = ({ children }: { children: any }) => <>{children}</>;
