import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_PAGE_ACCESS } from "@/shared/schemas";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import type { PageKey, PermissionRole } from "@/shared/nexus/contracts/permissions.types";

import { normalizeRbacRole } from "@/kernel/contracts/rbac";

export function usePageAccess(pageKey: PageKey | string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // admin = plus haut niveau tenant · opérateurs MCC qui ont accès pour assistance
  if (
    currentUser.role === 'admin' ||
    currentUser.role === 'mcc_super_admin' ||
    currentUser.role === 'mcc_support' ||
    currentUser.role === 'mcc_junior_dev'
  ) return true;

  // Normalisation canonique du rôle (gère les tokens legacy "server", "host"…)
  const role = (normalizeRbacRole(currentUser.role) || currentUser.role) as PermissionRole;

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
