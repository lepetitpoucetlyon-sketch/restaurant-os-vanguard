# Audit P2 — Verticales non-restaurant

> Suite de l'audit LOGIQUE MÉTIER 2026-08-30. Le P2 originel dit
> « auditer autres verticales ». Rapport lecture-seule, aucune modif code.

**Date** : 2026-08-30
**Méthode** : mêmes sondes que le golden path restaurant — adapters × callers,
events × émetteurs × écouteurs, wiring UI → bus.

## Verdict en 3 lignes

Ce qu'on mesure ici est **l'état attendu du plan-profondeur (ADR-016)** :
verticales à différents stades (L1 blueprint, L2 adapters + XxxVertical monté,
L3 UI câblée). Restaurant est à L3, les 6 verticales scaffoldées (hotel,
garage, clinic, bakery, salon, retail) sont à L2, les 4 dernières (coworking,
florist, gym, veterinary) sont à L1 avec un défaut d'enregistrement qui les
fait tomber silencieusement sur le fallback `custom`.

Rien à supprimer. Deux chantiers concrets ressortent : signaler le stade dans
l'UI (personne ne sait aujourd'hui si sa verticale est mature) et enregistrer
les 4 verticales manquantes dans `VerticalRegistry`.

## Mesures (session 2026-08-30, `rg` sur `src/`)

### 1. Enregistrement dans `VerticalRegistry`

Source : `src/shared/plugins/VerticalRegistry.ts:42-50`.

| Verticale | Enregistrée ? | Fallback |
|---|---|---|
| restaurant | ✅ `RestaurantVertical` | — |
| hotel | ✅ `HotelVertical` | — |
| garage | ✅ `AutoVertical` | — |
| clinic | ✅ `HealthVertical` | — |
| bakery | ✅ `BakeryVertical` | — |
| salon | ✅ `SalonVertical` | — |
| retail | ✅ `RetailVertical` | — |
| custom | ✅ `CustomVertical` | — |
| **coworking** | ❌ | → `custom` |
| **florist** | ❌ | → `custom` |
| **gym** | ❌ | → `custom` |
| **veterinary** | ❌ | → `custom` |

## 2. Adapters × callers externes (les 6 verticales enregistrées)

| Verticale | Adapters | Émission-fns totales | Callers hors `src/verticals/<v>/` |
|---|---|---|---|
| hotel | 9 | 18 | **0** |
| garage | 9 | 20 | **0** |
| clinic | 9 | 20 | **0** |
| bakery | 9 | 20 | **0** |
| salon | 9 | 12 | **0** |
| retail | 9 | 16 | **0** |

Le seul appelant de chaque adapter est le `XxxVertical.ts` de la même
verticale, à l'intérieur d'un `registerEventHandler` — pipeline interne fermé.

## 3. Events typés dans `vertical.events.ts` (82 events)

Chaque event est émis par un adapter, réécouté par un `registerEventHandler`
du `XxxVertical` correspondant, jamais déclenché depuis l'extérieur.

**Aucun événement n'est ni émis ni écouté depuis la couche UI/modules/api**.

Exemple canonique — `hotel.guest_checked_in` :
- typé : `src/shared/eventBus/events/vertical.events.ts:17`
- émis : `HotelOpsAdapter.emitCheckIn` (`HotelOpsAdapter.ts:4`) — **0 caller**
- écouté : `HotelVertical.ts:39` — dispatche 3 autres events sur le même bus fermé

## 4. Modèle mental

C'est la conséquence attendue de l'ADR-016 (profondeur build-time L0-L3).
Les verticales sont à des stades différents — c'est la trajectoire produit,
pas de la dette :
- **L1** — blueprint uniquement (coworking, florist, gym, veterinary)
- **L2** — adapters + `XxxVertical` monté (hotel, garage, clinic, bakery,
  salon, retail)
- **L3** — UI câblée sur adapter (restaurant seulement)

Le passage L2 → L3 est du travail feature (câbler chaque écran métier sur
les adapters existants), pas du nettoyage.

## 5. Ce qui n'est PAS un problème

- **Le typage ne pollue pas le runtime** : ces events ne sont jamais émis,
  donc jamais journalisés, jamais persistés en DLQ.
- **Aucun test ne se fie à un event vertical** : la suite passe à 2 472/2 472
  sans toucher à ces types.
- **L'écart 0-caller par adapter est attendu à L2** : c'est ce que L3 doit
  résoudre en câblant la vraie UI.

## 6. Ce qui EST un problème actionnable

### P2-C — 4 verticales silencieuses au fallback custom (P1)
Un tenant provisionné avec `variant=gym` tombe sur `CustomVertical` sans
signal UI. Seul `logger.warn` trace ce fallback côté serveur. Les fichiers
`XxxVertical.ts` correspondants existent pour ces 4 verticales (cf. mémoire
plan-profondeur) mais ne sont pas registered dans `VerticalRegistry.ts:42-50`.
Correctif : ajouter les 4 imports. Volume : 1 fichier, ~5 lignes.

### P2-B — Aucun signal UI du stage L1/L2/L3 (P2)
Un utilisateur qui provisionne `variant=hotel` reçoit un Hotel OS à L2
sans savoir qu'il manque le câblage L3 (folio, housekeeping, yield). Aucun
badge, aucune bannière. Correctif : `readonly stage: 'L1'|'L2'|'L3'` sur
`IVerticalPlugin`, badge « pré-alpha / β / stable » en UI quand stage < L3.
Volume : ~5 fichiers, réversible.

## 7. Ce qui NE devrait pas être touché

- **Ne pas supprimer les 82 events vertical-scoped** : ils sont la surface
  contractuelle que L3 devra consommer. La supprimer casse le plan-profondeur.
- **Ne pas retirer les 6 XxxVertical.ts scaffoldés** : mêmes raisons.
- **Ne pas relever un cliquet pour cacher l'écart 0-caller** : c'est un
  indicateur légitime de progression L2 → L3, à laisser visible.

## 8. Recommandation

Exécuter **P2-C** immédiatement (bug d'enregistrement, coût nul) et **P2-B**
dans un sprint dédié (transparence stage). Le passage L2 → L3 des 6
verticales reste du travail feature planifié séparément, hors périmètre de
l'audit LOGIQUE MÉTIER.

## Ground truth

- `rg 'BakeryOpsAdapter|HotelOpsAdapter|SalonOpsAdapter|AutoOpsAdapter|
  RetailOpsAdapter|HealthOpsAdapter'` hors `src/verticals/<v>/` et hors tests
  → 0 résultat pour chacun.
- `src/shared/eventBus/events/vertical.events.ts` : 82 clés d'event typées.
- `src/shared/plugins/VerticalRegistry.ts:42-50` : 8 `register` sur 12 variantes.
- `src/verticals/*/adapters/` : 54 fichiers adapters cumulés (9 × 6).
- Tests : `2 472/2 472 pass` — aucun test ne dépend de la scaffolding vertical.

Pas de modif code — c'est un rapport.
