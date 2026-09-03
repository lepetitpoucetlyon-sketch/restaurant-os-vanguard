/**
 * AlertRouter — routage des alertes par responsabilité (kernel, pur).
 *
 * Remplace les ~84 ciblages `roles: [...]` codés en dur (audit alertes.md N6/N7)
 * par une résolution d'une RESPONSABILITÉ métier vers des destinataires :
 *   1. destinataires nommés (userIds) déclarés dans la table de routage du tenant ;
 *   2. sinon, les rôles déclarés pour cette responsabilité (normalisés) ;
 *   3. sinon, les rôles par défaut de la responsabilité (par verticale) ;
 *   4. sinon (aucun) → repli sur la direction, avec `routingMissing: true` pour
 *      que le trou de configuration soit visible plutôt que silencieux.
 *
 * Pur : aucune dépendance vers modules/ ni vers Nexus — la table de routage est
 * fournie en entrée par l'appelant (le handler lit le tenant, le routeur décide).
 */
import { normalizeRbacRole, type RbacRole } from '@/kernel/contracts/rbac';

export type Responsibility =
  | 'RESP_SERVICE'
  | 'RESP_STOCK'
  | 'RESP_HYGIENE'
  | 'RESP_FISCAL'
  | 'RESP_RH'
  | 'RESP_TECHNIQUE'
  | 'RESP_DIRECTION';

/** Entrée de routage — surensemble tolérant du contrat AlertRouting. */
export interface AlertRoutingEntry {
  responsibility?: string;
  eventType?: string;
  recipients?: string[]; // userIds nommés
  roles?: string[];
  enabled?: boolean;
}

/** Rôles par défaut d'une responsabilité (défauts restaurant ; surchargables par verticale). */
export const DEFAULT_RESPONSIBILITY_ROLES: Record<Responsibility, RbacRole[]> = {
  RESP_SERVICE: ['chef_rang', 'manager', 'directeur', 'admin'],
  RESP_STOCK: ['chef_cuisinier', 'manager', 'directeur', 'admin'],
  RESP_HYGIENE: ['chef_cuisinier', 'manager', 'directeur', 'admin'],
  RESP_FISCAL: ['comptable', 'manager', 'directeur', 'admin'],
  RESP_RH: ['manager', 'directeur', 'admin'],
  RESP_TECHNIQUE: ['manager', 'directeur', 'admin'],
  RESP_DIRECTION: ['directeur', 'admin'],
};

export interface ResolvedRecipients {
  userIds: string[];
  roles: string[];
  /** true = aucun destinataire propre trouvé → repli sur la direction. */
  routingMissing: boolean;
  /** true = le tenant a explicitement coupé cette responsabilité (entrée enabled:false). */
  muted: boolean;
}

function normalizeRoles(roles: readonly string[] | undefined): string[] {
  if (!roles) return [];
  const out: string[] = [];
  for (const r of roles) {
    const canonical = normalizeRbacRole(r) ?? normalizeRbacRole(String(r).toLowerCase());
    if (canonical) out.push(String(canonical));
  }
  return Array.from(new Set(out));
}

/**
 * Résout les destinataires d'une responsabilité.
 * @param responsibility responsabilité métier ciblée.
 * @param routings table de routage du tenant (peut être absente).
 */
export function resolveResponsibility(
  responsibility: Responsibility | string,
  routings?: AlertRoutingEntry[],
): ResolvedRecipients {
  const defaults = DEFAULT_RESPONSIBILITY_ROLES[responsibility as Responsibility];

  // Responsabilité inconnue (typo émetteur, valeur non déclarée) → repli direction,
  // trou de configuration signalé plutôt qu'une alerte adressée à personne.
  if (!defaults) {
    return {
      userIds: [],
      roles: DEFAULT_RESPONSIBILITY_ROLES.RESP_DIRECTION.map((r) => String(r)),
      routingMissing: true,
      muted: false,
    };
  }

  // Le tenant a-t-il coupé explicitement cette responsabilité ?
  const anyEntry = (routings ?? []).find(
    (r) => r.responsibility === responsibility || r.eventType === responsibility
  );
  if (anyEntry && anyEntry.enabled === false) {
    return { userIds: [], roles: [], routingMissing: false, muted: true };
  }

  const entry = anyEntry && anyEntry.enabled !== false ? anyEntry : undefined;
  const userIds = Array.from(new Set(entry?.recipients ?? []));
  const configuredRoles = normalizeRoles(entry?.roles);
  const roles = configuredRoles.length > 0 ? configuredRoles : defaults.map((r) => String(r));

  return { userIds, roles, routingMissing: false, muted: false };
}
