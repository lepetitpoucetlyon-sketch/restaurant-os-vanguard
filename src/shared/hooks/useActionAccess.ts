import { useAtomValue } from "jotai";
import { rbacConfigAtom } from "@/store/pillars/rbac";
import { DEFAULT_ACTION_ACCESS } from "@/shared/schemas/rbac.schemas";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import type { PageKey, PermissionRole } from "@/shared/nexus/contracts/permissions.types";
import { normalizeRbacRole } from "@/kernel/contracts/rbac";

export function useActionAccess(pageKey: PageKey | string, actionKey: string): boolean {
  const { currentUser } = useAuth();
  const config = useAtomValue(rbacConfigAtom);

  if (!currentUser) return false;
  // admin & opérateurs MCC ont accès complet pour assistance
  if (
    currentUser.role === 'admin' ||
    currentUser.role === 'mcc_super_admin' ||
    currentUser.role === 'mcc_support' ||
    currentUser.role === 'mcc_junior_dev'
  ) return true;

  // Normalisation canonique du rôle (gère les tokens legacy "server", "host"…)
  const role = (normalizeRbacRole(currentUser.role) || currentUser.role) as PermissionRole;

  // Overrides depuis la configuration tenant
  if (config?.actionOverrides?.[pageKey]?.[actionKey]) {
    const overrides = config.actionOverrides[pageKey][actionKey];
    if (overrides.minLevel !== undefined) {
      // Comparer minLevel si configuré
    }
  }

  // Matrice par défaut
  const pageDefaults = DEFAULT_ACTION_ACCESS[pageKey];
  const actionRoles = pageDefaults ? pageDefaults[actionKey] : undefined;

  if (actionRoles && actionRoles.length > 0) {
    return actionRoles.includes(role);
  }

  // Par défaut autorisé si aucune restriction explicite n'est définie
  return true;
}
