"use client";
import React from 'react';
import { useNexusFleet } from '@/modules/intelligence/ia/fleet';
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
