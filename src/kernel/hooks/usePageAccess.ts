import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_PAGE_ACCESS } from '@nexus/contracts';;
import { useAuth } from "@/kernel/providers/NexusCoreContext";
import { PageKey, PermissionRole } from "@nexus/contracts/permissions.types";

export function usePageAccess(pageKey: PageKey | string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // Pas de bypass hardcodé par nom de rôle :
  // - 'super_admin' n'existe plus (renommé → 'proprietaire').
  // - Le super admin MCC opère via ses propres routes /app/(admin)/ et n'utilise PAS usePageAccess.

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
