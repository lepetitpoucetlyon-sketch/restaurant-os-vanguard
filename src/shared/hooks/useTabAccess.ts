import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_TAB_ACCESS } from "@/shared/schemas";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import { PageKey, PermissionRole } from "@/shared/nexus/contracts/permissions.types";

export function useTabAccess(pageKey: PageKey | string, tabKey: string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // admin = plus haut niveau tenant · mcc_super_admin = opérateur MCC qui a accès à tout
  if (currentUser.role === 'admin' || currentUser.role === 'mcc_super_admin') return true;

  const role = currentUser.role as PermissionRole;

  // Defaults
  const pageDefaults = DEFAULT_TAB_ACCESS[pageKey];
  const tabRoles = pageDefaults ? pageDefaults[tabKey] : undefined;

  // Overrides
  if (config?.tabOverrides?.[pageKey]?.[tabKey]) {
    const overrides = config.tabOverrides[pageKey][tabKey];
    
    if (overrides.blocked && overrides.blocked.includes(role)) {
      return false; // Blocked explicitly
    }
  }

  if (tabRoles && tabRoles.length > 0) {
    return tabRoles.includes(role);
  }

  return true;
}
