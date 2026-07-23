"use client";
import React from 'react';
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
