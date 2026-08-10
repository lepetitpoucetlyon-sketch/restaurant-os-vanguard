import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/bootstrap/store/pillars/rbac";
import { DEFAULT_TAB_ACCESS } from "@/modules/human";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import { PageKey, PermissionRole, PERMISSION_ROLE_LEVELS } from "@/shared/nexus/contracts/permissions.types";

export function useTabAccess(pageKey: PageKey | string, tabKey: string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true;

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
