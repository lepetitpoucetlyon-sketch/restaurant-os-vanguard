// @ts-nocheck
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
