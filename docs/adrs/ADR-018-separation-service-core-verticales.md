# ADR-018 — Séparation `ops/service/core` (générique) vs `ops/service/<verticale>`

- **Statut** : Accepté — 2026-08-31
- **Contexte source** : Plan de merge 2026-08-31, Vague 0. Prérequis de la Vague 1.1.
- **Voir aussi** : ADR-004 (verticales universelles), ADR-015 (loi des couches), ADR-016 (profondeur build-time/runtime)

## Problème

`src/modules/ops/service/` mélange trois natures de code sous un même niveau
d'arborescence, sans qu'aucune règle ne dise laquelle est laquelle.

État mesuré au 2026-08-31 (`ls`/`find` sur l'arbre courant) :

| Sous-module | Fichiers | Nature réelle |
|---|---|---|
| `pos/` | 139 | verticale — encaissement restaurant/retail |
| `printers/` | 21 | générique — impression de tickets, tout métier |
| `repair-intake/` | 14 | verticale — réception atelier (garage) |
| `notifications/` | 2 | générique — passerelle SMS |
| `core/` | 16 (dont 12 `.gitkeep`) | générique — scaffolding vide + `ServiceTicketService` |
| `kiosk/` | 1 (`KioskPage.tsx`) | verticale — borne restaurant |
| `pms/` | 1 (`PmsPage.tsx`) | verticale — property management hôtel |
| `bar/` | 1 (`barAtoms.ts`) | verticale — bar |
| `frontdesk/` | 1 (`WaitlistManager.ts`) | générique — file d'attente d'accueil |

Deux conséquences directes :

1. **Rien n'empêche un module générique d'importer un module verticalisé.**
   `printers/` peut importer `pos/` : la règle du barrel s'arrête au pilier, pas
   au domaine. La verticalisation fuit vers le socle.
2. **La 13ᵉ verticale n'a pas de place évidente.** Ajouter `salon` ou `veterinary`
   crée un 10ᵉ dossier frère de `pos/`, indistinguable de `core/`.

À noter : `kds` **n'est pas** dans `service/` — il vit dans
`src/modules/ops/production/kds/` (109 entrées). La production a déjà sa propre
séparation `core/` vs métier (`kitchen/`, `lab/`, `repair-bay/`, `batch-planner/`).
`service/` est le seul domaine du pilier `ops` qui n'ait pas franchi ce pas.

## Décision

`ops/service/` se découpe en **deux étages nommés** :

```
src/modules/ops/service/
├── core/                     ← SOCLE — aucune connaissance de la verticale
│   ├── domain/               ServiceTicket, Workstation, ServiceContext
│   ├── application/          ServiceTicketService, TicketLifecycle
│   └── infrastructure/       passerelles neutres (impression, SMS)
├── restaurant/               ← pos, bar, kiosk
├── hospitality/              ← pms
└── repair/                   ← repair-intake
```

### La charte de découpage — trois tests, tous les trois obligatoires

Un module appartient à `core/` **si et seulement si** il passe les trois :

1. **Test du renommage** — on peut décrire ce qu'il fait sans employer un nom
   métier. `printers/` imprime un *document de service*, pas une *addition*. Passe.
   `kiosk/` prend une *commande de plats*. Ne passe pas.
2. **Test de la douzième verticale** — les 12 variantes (`restaurant`, `hotel`,
   `bakery`, `garage`, `salon`, `clinic`, `retail`, `custom`, `gym`, `coworking`,
   `veterinary`, `florist`) en ont toutes un usage plausible. Une file d'attente
   d'accueil (`frontdesk/`) : oui, du salon à la clinique. Une carte des vins : non.
3. **Test du lexique** — ses libellés passent par `useLexicon()` et n'ont aucune
   chaîne métier en dur. Un module `core/` qui affiche « Table » est disqualifié :
   c'est `useLexicon('unit.table')` ou rien.

Un module qui échoue à un seul test est **verticalisé** et descend sous
`service/<verticale>/`.

### Le sens des dépendances est unique et non négociable

```
service/<verticale>/  ──►  service/core/  ──►  kernel/, lib/
        ▲
        └── jamais l'inverse, jamais entre verticales
```

- `core/` **n'importe jamais** une verticale. Pas de `switch (variant)`, pas de
  registre qui connaisse les noms des verticales.
- Une verticale **n'importe jamais** une autre verticale. `hospitality/` qui veut
  encaisser passe par `core/`, pas par `restaurant/pos/`.
- Ce qui remonte d'une verticale vers le socle passe par un **contrat neutre**
  (`kernel/contracts/`) ou par le **bus** (ADR-015 §canaux légitimes), jamais par
  un import direct inversé.

### Où atterrit chaque module existant

| Module | Destination | Test qui tranche |
|---|---|---|
| `pos/` | `service/restaurant/pos/` | échoue au test du lexique (couvert, addition, service) |
| `bar/` | `service/restaurant/bar/` | échoue au test de la 12ᵉ (pas de bar en clinique) |
| `kiosk/` | `service/restaurant/kiosk/` | échoue au test du renommage |
| `pms/` | `service/hospitality/pms/` | property management = hôtellerie |
| `repair-intake/` | `service/repair/intake/` | réception atelier = garage |
| `printers/` | `service/core/printing/` | passe les trois |
| `notifications/` | `service/core/notifications/` | passe les trois |
| `frontdesk/` | `service/core/frontdesk/` | passe les trois |
| `core/` | reste, se remplit | — |

`pos/` est le cas dur : 139 fichiers dont une part est du socle d'encaissement
(panier, moyens de paiement, remise) et non du restaurant. **La migration se fait
en deux temps** : (1) déplacer `pos/` en bloc sous `restaurant/` — mouvement pur,
zéro extraction ; (2) faire remonter vers `core/` ce qui passe les trois tests,
un lot à la fois, chaque lot avec son `preflight` vert. Ne pas tenter les deux
dans le même commit.

## Enforcement

- Le barrel racine `src/modules/ops/index.ts` reste **la seule surface publique**.
  Le renommage interne ne doit **rien** changer à ce que voient les autres piliers.
- Règle ESLint à ajouter une fois la Vague 1.1 terminée : sous
  `src/modules/ops/service/core/**`, tout import vers
  `src/modules/ops/service/{restaurant,hospitality,repair}/**` est une **erreur**.
  Idem pour tout import croisé entre deux verticales.
- Comme toute gate : ratchet qui ne peut que descendre, jamais desserrer (ADR-015 §2).

## Conséquences

- **+** La question « où va ce module ? » a une réponse mécanique en trois tests.
- **+** Une nouvelle verticale ajoute un dossier frère, sans toucher au socle.
- **+** Le test du lexique fait du `useLexicon` une conséquence structurelle,
  plus une intention (cf. Vague 3 du plan de merge).
- **−** Un renommage large : `pos/` bouge 139 fichiers d'un coup. Le coût est
  concentré sur un commit de `git mv` pur, à faire **avant** de rapatrier
  quoi que ce soit d'autre (sinon on rapatrie dans l'ancienne arborescence).
- **−** `core/` est aujourd'hui presque vide (12 `.gitkeep`). Il le restera un
  moment : le remplir est un chantier d'extraction, pas un effet du renommage.
