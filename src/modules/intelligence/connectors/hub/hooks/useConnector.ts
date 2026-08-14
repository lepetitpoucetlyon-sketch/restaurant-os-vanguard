"use client";

import { useMemo } from 'react';
import { useAuth, useTenant } from '@/kernel/providers/NexusCoreProvider';
import { ConnectorHub } from '../ConnectorHub';
import type { ConnectorPerm, ConnectorState, ConnectorUserContext } from '@/lib/connectors/manifest/types';
import type { PermissionRole } from '@nexus/contracts/permissions.types';

export interface UseConnectorResult {
  /** Le connecteur est disponible pour ce vertical + les capabilities du tenant */
  isAvailable: boolean;
  /** État Nexus du connecteur (null = non encore chargé ou auto-activation pending) */
  state: ConnectorState | null;
  /** Connecteur actif (status='active') */
  isActive: boolean;
  canConfigure: boolean;
  canManage: boolean;
  canUse: boolean;
  can: (perm: ConnectorPerm) => boolean;
}

/**
 * Hook client pour vérifier l'accès à un connecteur.
 *
 * @param connectorId  ID du connecteur (ex: 'uber-eats', 'bofip')
 * @param state        État Nexus du connecteur, à fournir depuis le composant parent
 *                     qui charge tenants/{tenantId}/connectors/{id} via Nexus.
 */
export function useConnector(
  connectorId: string,
  state: ConnectorState | null = null,
): UseConnectorResult {
  const { currentUser } = useAuth();
  const { activeTenantConfig } = useTenant();

  return useMemo(() => {
    // isAvailable : le serveur (/api/connectors) filtre déjà par tenant + variant + capabilities.
    const isAvailable = true;

    // Mapper les alias génériques vers les rôles RBAC canoniques.
    // 'super_admin' n'existe plus (renommé → 'proprietaire') ; les alias
    // admin/superadmin/root pointent vers proprietaire (niveau 100 du tenant).
    // Si l'utilisateur n'est pas authentifié → fallback plongeur (niveau minimal).
    const rawRole = currentUser?.role ?? 'plongeur';
    const roleAlias: Record<string, PermissionRole> = {
      admin:      'proprietaire',
      superadmin: 'proprietaire',
      root:       'proprietaire',
    };
    const userCtx: ConnectorUserContext = {
      role: (roleAlias[rawRole] ?? rawRole) as PermissionRole,
    };

    const can = (perm: ConnectorPerm) =>
      ConnectorHub.canUserAccess(connectorId, userCtx, perm);

    return {
      isAvailable,
      state,
      isActive: state?.status === 'active',
      canConfigure: can('configure'),
      canManage: can('manage'),
      canUse: can('use'),
      can,
    };
  }, [connectorId, currentUser, activeTenantConfig, state]);
}
