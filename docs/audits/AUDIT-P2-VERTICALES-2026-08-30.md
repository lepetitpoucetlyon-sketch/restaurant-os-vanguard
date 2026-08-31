# Audit P2 — Verticales non-restaurant

> Suite de l'audit LOGIQUE MÉTIER 2026-08-30. Le P2 originel dit
> « auditer autres verticales ». Rapport lecture-seule, aucune modif code.

**Date** : 2026-08-30
**Méthode** : mêmes sondes que le golden path restaurant — adapters × callers,
events × émetteurs × écouteurs, wiring UI → bus.

## Verdict en 3 lignes

Les 6 verticales scaffoldées (hotel, garage, clinic, bakery, salon, retail) ont
chacune ~9 adapters × ~17 méthodes d'émission = **~106 fonctions d'émission par
verticale, 0 caller externe**. Le seul flux existant est intra-`XxxVertical.ts`
(register → adapter → register). Aucun composant UI, aucune couche domaine
n'appelle l'adapter — la scaffolding est architecturalement morte.

Les 4 verticales restantes (coworking, florist, gym, veterinary) n'ont même
pas de fichier `XxxVertical.ts` enregistré dans `VerticalRegistry` : elles
tombent silencieusement sur le fallback `custom`.

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
Les verticales scaffoldées sont à **L1 (blueprint + adapters)** ou **L2
(vertical mounted)**, jamais à **L3 (UI câblée)**. Le plan-profondeur
(cf. mémoire `project_plan_profondeur_state.md`) documente que 4 verticales
ont reçu de la vraie logique métier ; les 6 autres restent au stade infra.

## 5. Ce qui n'est PAS un problème

- **Le typage ne pollue pas le runtime** : ces events ne sont jamais émis, donc
  jamais journalisés, jamais persistés en DLQ.
- **Aucun test ne se fie à un event vertical** : la suite passe à 2 472/2 472
  sans toucher à ces types.
- **`VerticalRegistry.resolve` a un fallback propre** vers `custom` pour les
  4 non enregistrées — le tenant provisionne quand même.

## 6. Ce qui EST un problème

### P2-A — Fausse promesse dans la surface de types
82 `NexusEventName` vertical-scoped exposées dans `NexusEventName` peuvent
laisser croire qu'un handler pilote la verticale. Un dev qui `emit('hotel.
guest_checked_in')` depuis une nouvelle UI verra le typage passer mais rien
d'autre ne bougera — pas de sceau fiscal, pas de tâche housekeeping réelle.

### P2-B — 6 fichiers `XxxVertical.ts` chargés à chaque bootstrap
Les 6 imports dynamiques de `VerticalRegistry.ts:44-49` s'exécutent au démarrage,
enregistrent 6 × (18 à 20) event handlers dormants. Chaque tenant paie
l'initialisation même s'il utilise `variant=restaurant`.

### P2-C — 4 verticales silencieuses au fallback custom
Un tenant provisionné avec `variant=gym` tombe sur `CustomVertical` sans
avertissement UI. Seul `logger.warn` trace ce fallback (côté serveur).
L'utilisateur croit avoir Gym OS, il a Custom.

### P2-D — L'audit LOGIQUE MÉTIER restaurant ne s'applique pas
Le golden path RBAC / événements / réglages testé LOT A-I sur `restaurant`
n'a **aucun équivalent** dans les 6 autres verticales scaffoldées. Aucune
verticale au-delà de restaurant n'est en mesure d'être auditée pour la même
promesse « bout-en-bout ».

## 7. Options (non exécutées)

Trois options mutuellement exclusives, à trancher hors P2 :

**Option A — Purge** : supprimer les 6 XxxVertical.ts + adapters + 82 events.
Volume : ~110 fichiers, gain immédiat sur `NexusEventName`. Perte : le travail
plan-profondeur scaffoldé. Non recommandé sans arbitrage.

**Option B — Marquage explicite** : ajouter `readonly stage: 'L1' | 'L2' | 'L3'`
dans `IVerticalPlugin`, exposer un badge « β » ou « pré-alpha » en UI quand
le stage < L3, et logger un `warn` visible pour les 4 non enregistrées.
Volume : ~5 fichiers. Réversible.

**Option C — Câblage minimal par verticale** : sur chaque XxxVertical, ajouter
un émetteur UI-driven pour l'event pivot (ex. `hotel.guest_checked_in` depuis
un `/pms/check-in`). Volume : plusieurs jours par verticale. Aligne la
promesse sur restaurant.

Recommandation implicite : **Option B** (marquage) le temps d'un arbitrage
produit, sans casser le plan-profondeur. La Purge peut suivre si le produit
décide de retirer une verticale du roadmap.

## Ground truth

- `rg 'BakeryOpsAdapter|HotelOpsAdapter|SalonOpsAdapter|AutoOpsAdapter|
  RetailOpsAdapter|HealthOpsAdapter'` hors `src/verticals/<v>/` et hors tests
  → 0 résultat pour chacun.
- `src/shared/eventBus/events/vertical.events.ts` : 82 clés d'event typées.
- `src/shared/plugins/VerticalRegistry.ts:42-50` : 8 `register` sur 12 variantes.
- `src/verticals/*/adapters/` : 54 fichiers adapters cumulés (9 × 6).
- Tests : `2 472/2 472 pass` — aucun test ne dépend de la scaffolding vertical.

Pas de modif code — c'est un rapport.
