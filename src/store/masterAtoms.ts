// @ts-nocheck
// @ts-nocheck
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { 
  DEFAULT_TENANT_CONFIG, 
  type TenantConfig 
} from '@/shared/nexus-contract';

/**
 * 🧬 tenantConfigAtom
 * The Grade VIII genomic source of truth.
 * Initialized with a pure, agnostic shell.
 */
export const tenantConfigAtom = atomWithStorage<TenantConfig>('nexus_tenant_config', {
    id: 'default_node',
    ...DEFAULT_TENANT_CONFIG
});

/**
 * 🛡️ capabilityAtom
 * Selector to access system functional availability.
 */
export const capabilityAtom = atom(
    (get) => get(tenantConfigAtom).capabilities
);

/**
 * 🛰️ orchestratorSignalAtom
 * Direct bridge to the MCC command flow.
 */
export const orchestratorSignalAtom = atom(
    (get) => get(tenantConfigAtom).status
);

/**
 * 👑 Master Atoms - Universal SaaS Forge
 * State management for the Master Command Control (MCC).
 * These atoms are restricted to Suzerain-level operations.
 */

export interface MasterConfig {
    maintenanceMode: boolean;
    killSwitch: boolean;
    allowedFeatures: string[];
    [key: string]: any;
}

/** 🌐 Fleet Health Tracking (Master only) */
export const fleetHealthAtom = atom<Record<string, { status: string; lastPing: string }>>({});

/** 📜 Global Policies distributed via the Bridge */
export const globalPolicyAtom = atom<MasterConfig>({
    maintenanceMode: false,
    forceLogout: false,
    allowedCapabilities: [], // Pure by default
    securityLevel: 'standard'
});

/** 🗝️ Signature of the current MCC Commander session */
export const commanderSignatureAtom = atom<string | null>(null);

/** 🚨 Emergency Lockout State */
export const emergencyLockoutAtom = atom<boolean>(false);
