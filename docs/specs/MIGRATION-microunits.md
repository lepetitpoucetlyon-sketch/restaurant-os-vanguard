# 💶 Plan de migration cents → microunits

> Statut : **plan** (non exécuté). Rédigé après cartographie du code, 2026-06-14.
> Compagnon de l'audit `ARCHITECTURE.md §9 P4`.

## Pourquoi un plan et pas un refactor en bloc

Une recherche `InCents` renvoie **478 occurrences sur ~120 fichiers**, dont du code
fiscal critique : contrats partagés (`shared/nexus` ~90), commerce (~63), finance
(`modules/finance` ~56 + `domain/finance` ~41), `domain/services` (~55), export FEC,
paie, banque.

Un renommage mécanique `*InCents → *InMicrounits` **corromprait des montants** : un
centime ne vaut pas un microunit. La conversion correcte est `cents × 10 000 = µ`
(1 cent = 0,01 € = 10 000 µ). Relabelliser sans multiplier fausse l'argent par 10 000.

De plus, certains `InCents` sont des **valeurs-frontière intentionnelles** (≈17 fichiers
Stripe / Swan / billing / payout / collection) : les PSP raisonnent en cents. Ces champs
ne doivent **pas** être migrés ; ils doivent être convertis au franchissement de la
frontière, comme le fait déjà `usePos.ts` (`priceInCents * 10000`).

Enfin, cette session **ne peut pas exécuter `npx vitest run`** (binding natif `rolldown`
absent du sandbox Linux). Toucher la chaîne fiscale sans tests verts serait imprudent.

## Ce qui est déjà fait

- **`CartItem` est unifié** : une seule définition (`src/modules/ops/engine/types.ts`,
  basée sur `CartLine` en microunits). `usePos.ts` l'importe et convertit correctement
  les prix produits en microunits. L'item « deux CartItem » de l'audit est obsolète.
- Le **pont additif** existe déjà par endroits, ex. `store/dashboardAtoms.ts` :
  `order.totalInMicrounits ?? (order.totalInCents ? order.totalInCents * 10000 : 0)`.

## Stratégie : additive, par couche, test-gated

Ne jamais renommer en place. Pour chaque entité :

1. **Ajouter** le champ `*InMicrounits` à côté de `*InCents` (schéma Zod + type).
2. **Écrire** les deux champs en parallèle (writers calculent µ = cents × 10 000).
3. **Lire** via un sélecteur de pont : `value.xInMicrounits ?? (value.xInCents ?? 0) * 10000`.
4. **Basculer** les consommateurs un par un vers le champ µ.
5. **Déprécier** `*InCents` (commentaire `@deprecated`), puis le retirer une fois zéro lecteur.
6. **Tester** à chaque étape (`vitest`, en particulier `financial-bridge.test.ts`,
   `chaos.test.ts`, et la chaîne NF525) + `npx tsc --noEmit`.

## Ordre recommandé (du moins au plus risqué)

| Lot | Périmètre | Risque | Notes |
|----:|-----------|--------|-------|
| 1 | Affichage seul (`components/**`, `lib/formatters.ts`) | Bas | Formatage ; aucune écriture en base. |
| 2 | Analytics / dashboards (`intelligence/analytics`, `store/dashboardAtoms`) | Bas | Lecture agrégée ; ponts déjà partiels. |
| 3 | Commerce non-fiscal (devis `Quote`, CRM) | Moyen | `quotes.types.ts` : `vatBreakdown.amountInCents`. |
| 4 | Ops / logistique (orders, stock, recipes) | Moyen | Vérifier les writers POS → bridge. |
| 5 | **Finance / NF525 / FEC / paie** | **Élevé** | Immuabilité fiscale ; ne jamais migrer un sceau déjà émis. Tests obligatoires. |
| — | **Frontières PSP** (Stripe/Swan/billing/payout) | À NE PAS migrer | Convertir à la frontière, garder `InCents`. |

## Garde-fou suggéré

Ajouter une règle ESLint (ou un check `sentrux`/preflight) interdisant tout **nouveau**
champ `*InCents` hors des dossiers frontière PSP, pour empêcher la dette de recroître
pendant que la migration progresse.

## Invariant de conversion

```
1 € = 100 cents = 1 000 000 µ
µ = cents × 10 000
cents = µ / 10 000
```

Toujours passer par `toMicrounits()` (`@/domain/schemas/primitives`) ; jamais
`as Microunits` direct.
