/**
 * @deprecated Déplacé vers `@/modules/intelligence/connectors/hub/hooks/useConnector`.
 * N'importe plus de modules — ce fichier ne re-exporte rien pour éviter l'inversion
 * shared→modules. Les consommateurs doivent importer directement depuis le pilier intelligence.
 */
export interface UseConnectorResult {
  isAvailable: boolean;
  state: unknown;
  isActive: boolean;
  canConfigure: boolean;
  canManage: boolean;
  canUse: boolean;
  can: (perm: string) => boolean;
}
