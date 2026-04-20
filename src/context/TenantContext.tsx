"use client";
import React from 'react';
import { useTenant as useNexusTenant } from '@/engines/core/NexusCoreProvider';

/**
 * TENANT CONTEXT COMPATIBILITY LAYER (Grade VI)
 * Redistributes the unified tenant state from NexusCoreProvider to existing components.
 */
export const useTenant = useNexusTenant;

export const TenantProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
