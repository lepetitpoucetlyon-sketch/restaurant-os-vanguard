"use client";
import React from 'react';
import { useNexusFleet } from '@/src/modules/intelligence/ia/fleet/NexusFleetProvider';;
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
