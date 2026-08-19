import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_TAB_ACCESS } from "@/modules/compliance/domain/schemas/rbac";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import { PageKey, PermissionRole, PERMISSION_ROLE_LEVELS } from "@/shared/nexus/contracts/permissions.types";

export function useTabAccess(pageKey: PageKey | string, tabKey: string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // admin = plus haut niveau tenant · mcc_super_admin = opérateur MCC qui a accès à tout
  if (currentUser.role === 'admin' || currentUser.role === 'mcc_super_admin') return true;

  const role = currentUser.role as PermissionRole;
  const userLevel = currentUser.accessLevel ?? PERMISSION_ROLE_LEVELS[role] ?? 0;

  // Defaults
  const pageDefaults = DEFAULT_TAB_ACCESS[pageKey] || {};
  let minLevel = pageDefaults[tabKey] ?? 0;

  // Overrides
  if (config && config.tabOverrides && config.tabOverrides[pageKey] && config.tabOverrides[pageKey][tabKey]) {
    const overrides = config.tabOverrides[pageKey][tabKey];
    
    if (overrides.blocked && overrides.blocked.includes(role)) {
      return false; // Blocked explicitly
    }
    
    if (overrides.minLevel !== undefined) {
      minLevel = overrides.minLevel;
    }
  }

  return userLevel >= minLevel;
}
