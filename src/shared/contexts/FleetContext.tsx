"use client";
import React from 'react';
import { useNexusFleet } from '@/shared/providers/fleet';
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
