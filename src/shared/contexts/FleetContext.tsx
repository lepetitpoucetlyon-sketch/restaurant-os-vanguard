"use client";
import React from 'react';
import { useNexusFleet } from '@/modules/intelligence/fleet/NexusFleetProvider';
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
