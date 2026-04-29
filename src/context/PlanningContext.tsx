"use client";
import React from 'react';
import { useNexusOps } from '@/engines/ops/NexusOpsProvider';
import { Shift as DomainShift } from '@/types';

export type Shift = DomainShift;

export const usePlanning = () => (useNexusOps() as any)?.planning || { data: [], isLoading: false, shifts: [] };
export const PlanningProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
