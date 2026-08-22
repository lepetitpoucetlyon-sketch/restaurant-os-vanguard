import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_PAGE_ACCESS } from "@/shared/schemas";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import type { PageKey, PermissionRole } from "@/shared/nexus/contracts/permissions.types";

export function usePageAccess(pageKey: PageKey | string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // admin = plus haut niveau tenant · mcc_super_admin = opérateur MCC qui a accès à tout
  if (currentUser.role === 'admin' || currentUser.role === 'mcc_super_admin') return true;

  const role = currentUser.role as PermissionRole;

  // Defaults
  const defaultAllowed = DEFAULT_PAGE_ACCESS[pageKey] || [];
  const isAllowed = defaultAllowed.includes(role);

  // Overrides
  if (config && config.pageOverrides && config.pageOverrides[pageKey]) {
    const overrides = config.pageOverrides[pageKey];
    
    if (overrides.blocked && overrides.blocked.includes(role)) {
      return false; // Blocked explicitly
    }
    
    if (overrides.allowed && overrides.allowed.includes(role)) {
      return true; // Allowed explicitly
    }
  }

  return isAllowed;
}
