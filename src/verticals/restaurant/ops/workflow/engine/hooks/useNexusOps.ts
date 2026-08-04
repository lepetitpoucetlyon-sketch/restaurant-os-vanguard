"use client";

 
// eslint-disable-next-line no-restricted-imports
import { useNexusOps as useProviderNexusOps } from '@/modules/ops/providers/NexusOpsProvider';

/**
 * 🏛️ useNexusOps - Grade X Compatibility Facade
 * This hook acts as a bridge for legacy components (KDS, POS) 
 * while the core logic has migrated to NexusOpsProvider.
 */
export const useNexusOps = useProviderNexusOps;
