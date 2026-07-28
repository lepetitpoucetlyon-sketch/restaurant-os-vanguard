"use client";

import { useNexusOps as useProviderNexusOps } from '@/modules/ops/providers';

/**
 * 🏛️ useNexusOps - Grade X Compatibility Facade
 * This hook acts as a bridge for legacy components (KDS, POS) 
 * while the core logic has migrated to NexusOpsProvider.
 */
export const useNexusOps = useProviderNexusOps;
