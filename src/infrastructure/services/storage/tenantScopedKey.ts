/**
 * Tenant-scoped localStorage keys — SovereignGuard for browser storage.
 *
 * Every write must be namespaced by the active tenantId so that two
 * restaurants sharing a browser cannot see each other's terminals,
 * printers, settings, role grants, or draft data.
 *
 * Fallback: when no tenantId is resolvable (pre-login, SSR), keys are
 * prefixed with `t:unknown:` — those entries are never mistaken for a
 * real tenant's data and get purged on the next authenticated session.
 */

const TENANT_ID_KEY = 'nexus_tenant_id';
const UNKNOWN_TENANT = 'unknown';

function readActiveTenantId(): string {
  if (typeof window === 'undefined') return UNKNOWN_TENANT;
  try {
    const raw = window.localStorage.getItem(TENANT_ID_KEY);
    if (!raw) return UNKNOWN_TENANT;
    // atomWithStorage stores strings JSON-encoded (e.g. "\"my-tenant\"")
    const parsed = raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;
    return parsed && parsed.length > 0 ? parsed : UNKNOWN_TENANT;
  } catch {
    return UNKNOWN_TENANT;
  }
}

/** Scope a base storage key to the active tenant: `t:{tenantId}:{baseKey}`. */
export function tenantScopedKey(baseKey: string): string {
  return `t:${readActiveTenantId()}:${baseKey}`;
}

/**
 * Jotai `atomWithStorage` compatible storage adapter that scopes every key
 * by the active tenantId at read/write time.
 *
 * Usage:
 *   atomWithStorage<T>('nexus_global_settings', defaults, tenantScopedJSONStorage<T>())
 */
export function tenantScopedJSONStorage<T>() {
  return {
    getItem(key: string, initialValue: T): T {
      if (typeof window === 'undefined') return initialValue;
      try {
        const raw = window.localStorage.getItem(tenantScopedKey(key));
        return raw === null ? initialValue : (JSON.parse(raw) as T);
      } catch {
        return initialValue;
      }
    },
    setItem(key: string, newValue: T): void {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(tenantScopedKey(key), JSON.stringify(newValue));
      } catch { /* quota / private-mode — silently ignore */ }
    },
    removeItem(key: string): void {
      if (typeof window === 'undefined') return;
      try { window.localStorage.removeItem(tenantScopedKey(key)); } catch { /* noop */ }
    },
  };
}
