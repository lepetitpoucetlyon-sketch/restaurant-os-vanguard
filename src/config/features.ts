function parseBooleanEnv(value: string | undefined, fallback = false): boolean {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }

    if (normalized === 'false') {
        return false;
    }

    return fallback;
}

export interface InstanceFeatureFlags {
    enableProfileSwitcher: boolean;
}

export const instanceFeatureFlags: InstanceFeatureFlags = {
    enableProfileSwitcher: parseBooleanEnv(process.env.NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER, false),
};

// ── Vague 0+ feature flags ──────────────────────────────────────────────────
// Modes: 'off' (silent), 'warn' (log + allow), 'enforce' (block)
export type PolicyMode = 'off' | 'warn' | 'enforce';

function parsePolicyMode(value: string | undefined, fallback: PolicyMode = 'off'): PolicyMode {
    const v = value?.trim().toLowerCase();
    if (v === 'warn' || v === 'enforce' || v === 'off') return v;
    return fallback;
}

export interface OperationalFlags {
    /** C0.4 — SoD + threshold policy enforcement */
    policyEnforce: PolicyMode;
    /** C0.2 — µunits cash migration gate */
    munitsCash: PolicyMode;
    /** C1.4 — Offline fiscal sealing */
    offlineFiscal: PolicyMode;
    /** C0.3 — Audit interception on sensitive collections */
    auditIntercept: PolicyMode;
}

export const operationalFlags: OperationalFlags = {
    policyEnforce: parsePolicyMode(process.env.NEXT_PUBLIC_POLICY_ENFORCE, 'off'),
    munitsCash: parsePolicyMode(process.env.NEXT_PUBLIC_MUNITS_CASH, 'off'),
    offlineFiscal: parsePolicyMode(process.env.NEXT_PUBLIC_OFFLINE_FISCAL, 'off'),
    auditIntercept: parsePolicyMode(process.env.NEXT_PUBLIC_AUDIT_INTERCEPT, 'off'),
};
