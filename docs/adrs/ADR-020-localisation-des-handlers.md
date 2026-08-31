# ADR-020 — Localisation des handlers d'événements

- **Statut** : Accepté — 2026-08-31
- **Contexte source** : Plan de merge 2026-08-31, Vague 0. Prérequis de la Vague 1.4.
- **Voir aussi** : ADR-001 (eventId & idempotence), ADR-005 (outbox & DLQ), ADR-015 (canaux légitimes)

## Problème

`src/shared/eventBus/handlers/` contient **171 entrées** (mesuré 2026-08-31,
`ls src/shared/eventBus/handlers/ | wc -l`), à plat, tous piliers et toutes
verticales confondus. Douze d'entre eux sont couplés à des événements
restaurant (`pos.*`, `kds.*`, `bar.*`, `kiosk.*`) :

```
DishReboundHandler          KdsCourseManagerHandler     KdsPrepDelayAlertHandler
FireNextCourseHandler       KdsCoursePassedHandler      KdsPrepTimeAnalyzerHandler
HRClockInGuardHandler       KdsPassNotifierHandler      KdsPrintFallbackHandler
KDSRushAlertNotifier        KDSTicketDoneNotifier       KdsRoutingHandler
```

(mesure : `grep -ln "'pos\.\|'kds\.\|'bar\.\|'kiosk\." src/shared/eventBus/handlers/*.ts`
→ **12**, et non 14 comme estimé dans le plan de merge.)

Trois conséquences :

1. **`shared/` est en extinction** (ADR-015) : y ajouter du métier verticalisé
   va dans le sens inverse de la loi des couches.
2. **La logique restaurant est à deux endroits** : le module qui émet (`ops/production/kds/`)
   et le handler qui réagit (`shared/eventBus/handlers/`), à sept dossiers de distance.
   On ne peut ni lire ni supprimer une fonctionnalité d'un seul coup d'œil.
3. **`FireNextCourseHandler` (« faire marcher la suite ») est indéplaçable tant que
   le restaurant n'a pas de dossier à lui** — d'où l'ordre imposé : ADR-018 puis ADR-020.

À noter : le **câblage** est déjà correctement découpé.
`src/shared/eventBus/registerHandlers/` contient 40 fichiers groupés par
pilier/domaine (`ops-kds.ts`, `ops-bar.ts`, `ops-print.ts`, `finance-nf525.ts`…).
Le problème est donc uniquement la **localisation des fichiers de handler**, pas
leur enregistrement.

## Décision

### La règle

> **Un handler vit à côté du module qui possède la réaction, pas à côté du bus.**

Concrètement, trois destinations et une seule question pour trancher :

| Question | Destination |
|---|---|
| Le handler réagit pour le compte d'**un module** identifiable ? | `src/modules/<pilier>/<domaine>/<module>/handlers/` |
| Il réagit pour le compte d'**une verticale** (orchestration inter-modules propre au métier) ? | `src/verticals/<variante>/handlers/` |
| Il est **transverse** — vrai quels que soient le pilier et la verticale ? | `src/shared/eventBus/handlers/` (reste) |

**`shared/eventBus/handlers/` est réservé aux transverses**, et la liste des
familles admises est fermée :

- **audit & traçabilité** — journalisation, chaîne d'intégrité, WORM ;
- **télémétrie & métriques** — compteurs, latences, santé ;
- **résilience du bus** — DLQ, retry, idempotence, migration de payload (ADR-001, ADR-005) ;
- **fan-out cross-pilier pur** — un handler qui ne fait que retransmettre sans
  connaître le métier des deux côtés.

Tout ce qui n'entre pas dans ces quatre familles descend dans un module ou une verticale.

### Le test qui tranche « module » vs « verticale »

- **Module** si la réaction reste dans le périmètre du module émetteur ou d'un
  seul module cible. `KdsPrepTimeAnalyzerHandler` analyse des temps de préparation
  KDS pour le KDS → `ops/production/kds/handlers/`.
- **Verticale** si la réaction **orchestre plusieurs modules** au nom d'une règle
  métier propre au secteur. `FireNextCourseHandler` (« faire marcher la suite »)
  coordonne salle et cuisine selon une règle de service à la française →
  `src/verticals/restaurant/handlers/`.

Cas limite tranché explicitement : `HRClockInGuardHandler` réagit à un événement
restaurant mais applique une règle **RH** (pas de prise de commande sans pointage).
La réaction appartient au pilier `human` → `modules/human/effectifs/hr/handlers/`,
avec l'événement déclencheur reçu par le bus. Le pilier propriétaire de la
**réaction** l'emporte sur le pilier propriétaire de l'**événement**.

### Le câblage ne bouge pas de nature

- Chaque module ou verticale expose un `handlers/index.ts` qui **enregistre** ses
  handlers.
- `src/shared/eventBus/registerHandlers/<pilier>-<domaine>.ts` continue d'être le
  point d'appel, mais importe désormais depuis le barrel du pilier
  (`@/modules/<pilier>`) et non depuis `../handlers/XxxHandler`.
- L'ordre d'enregistrement reste déterministe (bootstrap ordonné) : déplacer un
  fichier ne doit pas changer l'ordre, sous peine de casser les chaînes de réaction.
- **Aucun handler n'est enregistré deux fois** : un handler déplacé sort de
  `handlers/index.ts` dans le même commit qu'il entre dans le barrel du module.

## Enforcement

- **Ratchet** : `ls src/shared/eventBus/handlers/*.ts | wc -l` ne peut que
  descendre. Valeur au 2026-08-31 : **170 fichiers** (171 entrées, dont `index.ts`).
- **Test d'invariant** : aucun fichier de `src/shared/eventBus/handlers/` ne
  référence un événement d'un préfixe verticalisé (`pos.`, `kds.`, `bar.`,
  `kiosk.`, `pms.`, `repair.`…). Ratchet à 12 aujourd'hui, cible 0.
- **Test d'invariant** : chaque handler est enregistré exactement une fois
  (pas de double `on()` sur le même couple événement/handler après déplacement).

## Conséquences

- **+** Supprimer une fonctionnalité devient local : le module, ses events, ses
  handlers sont dans le même sous-arbre.
- **+** `shared/eventBus/handlers/` redevient lisible : ce qui y reste est, par
  définition, transverse.
- **+** Une verticale peut être désactivée sans laisser des handlers orphelins
  branchés sur le bus.
- **−** Les imports de test qui pointent `@/shared/eventBus/handlers/XxxHandler`
  cassent au déplacement. Ils sont explicitement autorisés à viser un chemin
  profond (exception de test de la règle du barrel), donc à mettre à jour un par un.
- **−** Le déplacement doit être fait **après** ADR-018 : sans
  `modules/ops/service/restaurant/` ni `verticals/restaurant/handlers/`, la moitié
  des handlers n'a pas de destination.
