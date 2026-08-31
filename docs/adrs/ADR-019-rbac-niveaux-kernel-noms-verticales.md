# ADR-019 — RBAC : le kernel connaît les niveaux, les verticales nomment les rôles

- **Statut** : Accepté — 2026-08-31
- **Contexte source** : Plan de merge 2026-08-31, Vague 0. Prérequis de la Vague 1.2.
- **Voir aussi** : ADR-004 (verticales universelles), ADR-008 (isolation MCC/tenant), ADR-015 (loi des couches)

## Problème

Le RBAC a **deux sources de vérité qui ne se parlent pas**, et la première viole
la loi des couches.

### Source 1 — `src/kernel/contracts/rbac.ts` (7,8 Ko)

Table `RBAC_ROLES` déclarative, dont tous les dérivés (`PERMISSION_ROLE_LEVELS`,
`PERMISSION_ROLE_LABELS`, `TENANT_ADMIN_ROLES`, `FLEET_ROLES`) sont calculés.
Le fichier est propre — **mais il contient les noms métier de toutes les verticales** :

> `chef_atelier` (garage) · `praticien` (clinique/vétérinaire) · `curator` (luxe) ·
> `expert` (luxe) · `mecanicien` (garage) · `coiffeur` · `estheticienne` (salon) ·
> `receptionnaire` (garage, hôtel) · `collaborateur` (coworking) · `vendeur` (retail) ·
> `serveur` · `barman` · `cuisinier` · `chef_cuisinier` · `plongeur` · `hotesse` (restaurant)

Le kernel ne doit contenir **aucune logique métier** (ADR-015). Aujourd'hui il
contient le vocabulaire métier de 12 secteurs. Ajouter une 13ᵉ verticale oblige à
éditer le kernel — exactement ce que la loi des couches interdit.

> **Précision par rapport au plan de merge** : le problème n'est pas « du RBAC
> restaurant dans le kernel ». C'est **le RBAC des 12 verticales** dans le kernel.
> Un `grep waiter|chef|manager src/kernel/` ne prouve rien : `waiter` n'existe pas
> (c'est `serveur`), et `manager` est un niveau universel légitime.

### Source 2 — `src/verticals/_shared/derivation/RbacDeriver.ts`

Fonction pure `deriveRbac(answers, variant, capabilities, siteCount) → RolesTemplate`,
qui produit des `DerivedRole { key, label, tier, permissions, perSite, quorum }`
avec un axe `RoleTier = 'admin' | 'manager' | 'operator' | 'stagiaire'`.

C'est un **second système de rôles**, avec sa propre échelle (4 tiers), ses propres
clés, ses propres permissions — sans aucun pont vers `RBAC_ROLES` ni vers les
niveaux 10-1000. Les deux calculent la même chose et ne se rencontrent jamais.

## Décision

### 1. Le kernel ne connaît que l'échelle, jamais les noms

`kernel/contracts/rbac.ts` conserve **uniquement** ce qui est vrai pour les
12 verticales et le restera pour la 13ᵉ :

- `RbacScope = 'fleet' | 'tenant'` — la frontière MCC/tenant (ADR-008), universelle.
- L'**échelle de niveaux** et sa sémantique, nommée une fois pour toutes :

  | Niveau | Sens universel | Scope |
  |---|---|---|
  | 1000 / 900 / 800 | opérateur plateforme (éditeur) | `fleet` |
  | 100 | administrateur du tenant — RBAC, config fiscale | `tenant` |
  | 90 | direction — rapports financiers, RH | `tenant` |
  | 70 | encadrement — équipe, stock, clôture | `tenant` |
  | 60 | comptabilité — lecture finance, export légal | `tenant` |
  | 50 | encadrement métier — responsable d'une activité | `tenant` |
  | 40 | opérationnel — exécute l'acte métier principal | `tenant` |
  | 30 | accueil / support | `tenant` |
  | 10 | entretien / logistique interne | `tenant` |

- Les **rôles structurels** que tout tenant possède quelle que soit sa verticale :
  `admin` (100), `directeur` (90), `manager` (70), `comptable` (60), et les trois
  rôles `fleet`. Ceux-là restent dans le kernel : ils ne sont pas du métier, ils
  sont la structure de gouvernance d'un tenant.
- Les contrats : `RbacRoleDefinition`, `normalizeRbacRole`, `TENANT_ADMIN_ROLES`
  (dérivé de `level >= 70`), `LEGACY_ROLE_ALIASES`.

**Ce qui sort du kernel** : les 16 noms métier listés plus haut (niveaux 50, 45,
40, 35, 30, 10) et leurs `label` français.

### 2. Chaque verticale déclare ses rôles dans son blueprint

Le blueprint (`src/verticals/<variante>/`) porte un `roleMap` :

```ts
roleMap: {
  serveur:        { level: 40, labelKey: 'role.server' },
  chef_cuisinier: { level: 45, labelKey: 'role.head_chef' },
  barman:         { level: 35, labelKey: 'role.bartender' },
  plongeur:       { level: 10, labelKey: 'role.dishwasher' },
}
```

Deux règles sur ce `roleMap` :

- **`level` est pris dans l'échelle du kernel**, jamais inventé. Le type est
  `RoleLevel = 10 | 30 | 35 | 40 | 45 | 50 | 60 | 70 | 90 | 100`, exporté par le
  kernel : tsc refuse un niveau hors échelle.
- **`labelKey`, pas `label`.** Un rôle affiché passe par le lexique
  (`useLexicon`), jamais par une chaîne FR en dur — c'est la même règle que le
  test du lexique d'ADR-018, et ça prépare la Vague 3.

### 3. `RbacDeriver` devient le producteur, `roleMap` le contrat

Les deux systèmes se réconcilient dans un sens unique :

```
QualificationAnswers ──► RbacDeriver.deriveRbac() ──► roleMap du blueprint
                                                            │
                                     kernel: RoleLevel, RbacScope, contrats
                                                            │
                              useRbac(tenant) ── résout role → level ──► ActionGuard
```

- `RbacDeriver` **produit** un `roleMap` conforme au contrat kernel (fin des
  `RoleTier` parallèles : `tier` devient une projection de `level`, pas une
  seconde échelle).
- `useRbac()` résout `rôle → niveau` via le `roleMap` de la verticale du tenant
  actif, avec repli sur les rôles structurels du kernel.
- Aucun code applicatif ne compare des **noms** de rôles. Toute garde compare des
  **niveaux** (`level >= 70`). Un `if (role === 'serveur')` est une violation :
  il casse sur les 11 autres verticales.

## Enforcement

- **Test d'invariant** (`invariants.test.ts`) : les clés de `RBAC_ROLES` sont
  incluses dans l'ensemble `{fleet ×3, admin, directeur, manager, comptable}`.
  Toute réintroduction d'un nom métier dans le kernel fait rougir le test.
- **Test d'invariant** : chaque `roleMap` de verticale n'utilise que des `RoleLevel`
  de l'échelle, et chaque `labelKey` existe dans `fr.ts` (sinon la clé s'affiche
  brute — Loi 8 §3).
- **Ratchet** : nombre de comparaisons de rôles par nom dans `src/` — ne peut que
  descendre.
- `LEGACY_ROLE_ALIASES` reste : les jetons Firebase émis contiennent encore
  `super_admin`/`fleet_admin`. La table d'alias est le pont, à supprimer après
  migration des claims — **pas avant**, sous peine de déconnecter les sessions en cours.

## Conséquences

- **+** Ajouter une verticale ne touche plus le kernel : c'est un blueprint.
- **+** Fin des deux échelles concurrentes (`level` 10-1000 vs `RoleTier` ×4).
- **+** Les libellés de rôles deviennent traduisibles par construction.
- **−** Migration en trois temps obligatoire, jamais en un commit : (a) extraire
  `RoleLevel` et figer l'échelle ; (b) déplacer les 16 noms vers les blueprints
  avec repli temporaire sur le kernel ; (c) retirer le repli et poser l'invariant.
  Entre chaque temps, `preflight` vert.
- **−** Les gardes qui comparent aujourd'hui un nom de rôle doivent être réécrites
  en comparaison de niveau. C'est le vrai coût, et il est réparti sur tout `src/`.
