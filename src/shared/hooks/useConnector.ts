"use client";

import { useMemo } from 'react';
import { useAuth, useTenant } from '@/shared/providers/NexusCoreProvider';
import {  ConnectorHub  } from '@/bootstrap/legacy';;
import type { ConnectorPerm, ConnectorState, ConnectorUserContext } from '@/shared/connector-manifest/types';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';

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
    const NOT_AVAILABLE: UseConnectorResult = {
      isAvailable: false,
      state: null,
      isActive: false,
      canConfigure: false,
      canManage: false,
      canUse: false,
      can: () => false,
    };

    // isAvailable : le serveur (/api/connectors) filtre déjà par tenant + variant + capabilities.
    // On fait confiance à cette liste — pas de double-filtre côté client qui bloquerait
    // des connecteurs dont la requiredCapability n'est pas dans la config locale.
    const isAvailable = true;

    // Mapper les alias génériques vers les rôles RBAC canoniques
    const rawRole = currentUser?.role ?? 'super_admin';
    const roleAlias: Record<string, PermissionRole> = {
      admin:      'super_admin',
      superadmin: 'super_admin',
      root:       'super_admin',
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
