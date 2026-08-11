/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";
import React from 'react';
import { useNexusFleet } from '@/modules/intelligence';
export const useFleet = () => useNexusFleet();
export const FleetProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
