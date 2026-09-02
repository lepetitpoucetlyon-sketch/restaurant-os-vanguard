# CABLAGE.md — Plan de câblage et de complétude

> **Sujet** : tout ce qui, dans ce dépôt, **a l'air branché et ne l'est pas**.
> Réglages qui ne pilotent rien, événements que personne n'écoute, écrans sans garde,
> composants sans consommateur.
>
> **Ce n'est pas un plan de fonctionnalités.** Aucune ligne ici n'ajoute de capacité au
> produit. Chacune raccorde une promesse déjà faite au client à du code qui la tient.
>
> ⚠️ **Loi 7 (Zero-Claim)** — tous les chiffres ont été mesurés en session le 2026-08-27,
> sur un arbre **en mouvement** : la session `uiux-sprint1-lota-execution` modifiait
> `src/` au même moment (49 fichiers). Ce sont des instantanés, pas des constantes.
> Re-mesurer avant d'agir.

---

## 0. La thèse en une phrase

Trois mécanismes différents — les **réglages**, le **bus d'événements**, les **gardes RBAC** —
souffrent exactement de la même pathologie : **une déclaration sans consommateur**.

Le dépôt a déjà un nom pour ça. C'est la **Loi 8, le dernier kilomètre** :
*« une fonctionnalité écrite n'est pas une fonctionnalité livrée »*. La Gate 6 applique
cette loi aux composants d'interface. Ce plan l'étend aux trois câblages qu'elle ne
regarde pas encore.

**Pourquoi c'est plus grave qu'une fonctionnalité manquante.** Une case absente, le client
la réclame. Une case présente qui ne fait rien, il la coche, il constate que rien ne change,
et il conclut que le produit ne marche pas. On ne récupère pas cette impression-là.

---

## 1. Baseline mesurée — 2026-08-27

### 1.1 Réglages

| Indicateur | Mesuré | Source |
|---|---:|---|
| Pages de réglages déclarées | **25** | `config-registry.ts` (318 l.) |
| Entrées de réglage déclarées | **190** (184 clés uniques, 6 réutilisées) | idem |
| Réglages lus par du **code de production** | **38** | balayage, motif corrigé |
| Réglages lus **uniquement dans des tests** | **3** | idem |
| ⚠️ Réglages **morts** — aucune lecture nulle part | **143** | idem |
| *Ce qu'affichera la mesure M2 une fois corrigée* | *146* | corpus de mesure : **tests exclus** |
| *Pour mémoire : ce que la mesure M2 du dépôt annonce* | *7 lus / 177 morts* | `npm run measure` |

> **La mesure M2 se trompe de 31 réglages, et il faut le corriger en premier — § M.1.**
> Son motif est `getSetting\(\s*['"]([a-z0-9_]+)['"]` : il capture le **premier** argument.
> Or la vraie signature est `getSetting<T>('page', 'clé', défaut)`. La mesure lit donc la
> *page* et la compare à la liste des *clés* — ça ne correspond jamais.
> Exemple réel : `LoyaltyEngine.ts:21` fait
> `getSetting<number>('customer', 'loyalty_points_per_euro', 1)`. Le réglage **est** câblé.
> M2 le compte comme mort.

**Pages dont AUCUN réglage ne pilote quoi que ce soit** — priorité absolue :

| Page | Morts / déclarés |
|---|---:|
| `kitchen` | **13 / 13** |
| `staff` | **9 / 9** |
| `floor_plan` | **9 / 9** |
| `leaves` | **8 / 8** |
| `storage_map` | **5 / 5** |

**Pages partiellement câblées** :

| Page | Morts / déclarés | | Page | Morts / déclarés |
|---|---:|---|---|---:|
| `inventory` | 12 / 18 | | `customer` | 9 / 12 |
| `reservations` | 12 / 15 | | `haccp` | 9 / 11 |
| `pos` | 11 / 19 | | `finance` | 8 / 11 |
| `kds` | 11 / 16 | | `dashboard` | 5 / 9 |
| `planning` | 11 / 14 | | `bar` | 3 / 5 |

### 1.2 Bus d'événements

| Indicateur | Mesuré |
|---|---:|
| Événements déclarés dans `shared/eventBus/events/` | **406** |
| Types réellement émis (`NexusEventBus.emit`) | **232** (310 appels) |
| Types réellement écoutés (`NexusEventBus.on`) | **162** (244 abonnements) |
| ⚠️ **Écoutés mais jamais émis** — le gestionnaire attend pour rien | **107** |
| Émis mais jamais écoutés — l'émission ne déclenche rien | **177** |
| Déclarés, ni émis ni écoutés — contrat mort | **74** |
| Émissions à nom **calculé** (rejeu DLQ, outbox) | 8 sites |

> **Les 107 « écoutés jamais émis » sont la catégorie dangereuse.** Un abonnement existe,
> le code de réaction est écrit, testé peut-être — et il ne s'exécutera jamais, parce que
> personne ne tire la ficelle. C'est une fonctionnalité qui a l'air livrée dans le code et
> qui est absente du produit. Exemples mesurés : `cash_drawer.opened_unauthorized`,
> `cert.expired`, `analytics.anomaly_detected`, `commerce.promotion_expired`,
> `biggroup.confirmed`.

> Les 74 contrats morts se concentrent sur : `health` (11), `auto` (9), `bakery` (7),
> `hotel` (7), `retail` (4), `salon` (4), `fleet` (4), `florist` (3), `gym` (2).
> C'est la signature des verticales déclarées plus vite qu'implémentées.

### 1.3 Gardes RBAC

| Indicateur | Mesuré |
|---|---:|
| Pages `page.tsx` | **84** |
| … avec `withPageGuard` | **40** (47 %) |
| Routes API `route.ts` | **211** |
| … avec une garde serveur | **167** (79 %) |
| `<ActionGuard>` — garde au niveau de l'action | **12** usages, 11 fichiers |

**Les 44 routes sans garde de rôle, classées** — une signature vérifiée n'est pas un trou :

| Protection | Nombre | Verdict |
|---|---:|---|
| Webhook à signature vérifiée (`createHmac`, `stripe-signature`…) | 9 | ✅ légitime |
| Cron à secret partagé | 5 | ✅ légitime |
| Clé d'API tenant | 3 | ✅ légitime |
| ⚠️ **Aucune protection visible** | **27** | à trancher une par une |

> **Sur les 84 pages, l'écart n'est pas de 44.** `src/app/(admin)/layout.tsx` filtre déjà
> par `ADMIN_ROLES` : les 14 pages du groupe `(admin)` sont couvertes au niveau du layout,
> même sans `withPageGuard`. Le vrai trou est ailleurs — voir § G.1.

### 1.4 Hygiène

| Indicateur | Mesuré | Statut |
|---|---:|---|
| Composants sans consommateur | **77** | sous cliquet |
| Composants exportés sous un nom déjà pris | **27** | informatif |
| Erreurs potentiellement avalées | **198** | informatif |
| Parité i18n `es` / `pt` / `ja` | **28 %** (337 clés manquantes chacune) | informatif |
| Clés i18n appelées mais absentes en `fr` | **0** | ✅ |

---

## LOT M — Réparer l'instrument avant de s'en servir

> **En premier, et sans discussion.** Toutes les décisions de ce plan reposent sur des
> compteurs. Deux d'entre eux sont faux. Agir sur un chiffre faux, c'est réparer ce qui
> n'est pas cassé et rater ce qui l'est.

### M.1 — `[ ]` Corriger le motif de la mesure M2

**Fichier** : `scripts/measure/measures.mjs`, mesure `m2_settings`.

```js
// AVANT — capture le 1er argument, donc la PAGE, jamais la clé.
for (const m of src.matchAll(/getSetting\(\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);

// APRÈS — la vraie signature est getSetting<T>('page', 'clé', défaut).
// PIÈGE (erreur réellement commise, mesurée le 2026-08-27) : le motif d'origine lisait
// la page et la comparait à la liste des clés. Résultat : 7 réglages « lus » annoncés
// au lieu de 38 réels — une sous-évaluation du câblage de 82 %.
// Le générique <number> entre le nom et la parenthèse doit être toléré.
const ACCES = /\b(?:usePageSetting|getSetting)\s*(?:<[^>]*>)?\s*\(\s*['"]([a-z0-9_]+)['"]\s*(?:,\s*['"]([a-z0-9_]+)['"])?/g;
for (const m of src.matchAll(ACCES)) {
  const cle = m[2] ?? m[1];        // forme à 2 arguments, sinon forme à 1
  lus.add(cle);
}
```

- **Effet attendu — vérifié en session, code exécuté sur le corpus réel** :
  `unreadSettings` passe de **177 à 146**, `lus` de **7 à 38**. C'est une **baisse**, donc
  aucun conflit avec la Loi 2 : `UNREAD_SETTINGS_MAX` est abaissé de 177 à 146 dans
  `preflight.sh`, et `.gate-baseline.json` re-figé à la baisse.
- **Vérification** : `npm run measure` doit afficher `extra: { declares: 184, lus: 38 }`.

> **Pourquoi 146 et non 143.** Le balayage complet trouve 143 réglages morts ; la mesure
> en annoncera 146. L'écart, ce sont **3 réglages lus uniquement dans des tests** —
> `corpus.mjs` exclut les fichiers `.test.`/`.spec.`. Les deux chiffres sont justes, ils ne
> répondent pas à la même question. Le cliquet suit la mesure : **146**.
- **Effort** : 1 h

### M.2 — `[ ]` Quatorzième mesure : câblage du bus d'événements

**Fichier** : `scripts/measure/measures.mjs`

```js
// ─────────────────────────────────────────────────────────────────────────────
// M13 — Événements sans producteur
// ─────────────────────────────────────────────────────────────────────────────
// Un abonnement dont l'événement n'est jamais émis est une fonctionnalité qui a
// l'air livrée dans le code et qui est absente du produit. C'est la Loi 8
// appliquée au bus.
// PIÈGE : 8 sites émettent un nom CALCULÉ (rejeu DLQ, outbox, ServerEventBus).
// Les compter comme « rien d'émis » ferait remonter à tort des événements qui
// sont bel et bien rejouables. On les recense à part, on ne les compte pas.
export const m13_busWiring = {
  id: 'busOrphanEvents',
  titre: 'Événements écoutés sans producteur',
  run(c) {
    const emis = new Set(), ecoutes = new Map(), dynamiques = [];
    for (const [f, src] of c.contenu) {
      for (const m of src.matchAll(/NexusEventBus\.emit\(\s*['"]([^'"]+)['"]/g)) emis.add(m[1]);
      if (/NexusEventBus\.emit\(\s*[`a-zA-Z_]/.test(src)) dynamiques.push(c.rel(f));
      for (const m of src.matchAll(/NexusEventBus\.(?:on|subscribe)\(\s*['"]([^'"]+)['"]/g)) {
        if (!ecoutes.has(m[1])) ecoutes.set(m[1], []);
        ecoutes.get(m[1]).push(c.rel(f));
      }
    }
    const detail = [...ecoutes.keys()]
      .filter(e => !emis.has(e))
      .sort()
      .map(e => `${e} — écouté par ${ecoutes.get(e).length} gestionnaire(s), jamais émis`);
    return {
      valeur: detail.length,
      detail,
      extra: { emis: emis.size, ecoutes: ecoutes.size, sitesDynamiques: dynamiques.length },
    };
  },
};
```

- **Baseline attendue au premier passage** : **107**.
- **Cliquet** : `BUS_ORPHAN_EVENTS_MAX=107` dans `preflight.sh`, entrée dans
  `CLIQUETS` de `gate-last-mile.mjs`, entrée dans `ratchets` de
  `verify-gate-integrity.mjs`, puis re-freeze de `.gate-baseline.json`.
- **⚠️ Recopier le seuil à l'identique** dans le second argument de `seuil()` :
  un défaut différent de `preflight.sh` est un desserrement silencieux en embuscade.
- **Effort** : 3 h

### M.3 — `[ ]` Quinzième mesure : gardes manquantes sur les routes API

```js
// M14 — Routes API sans garde ni signature.
// PIÈGE : un webhook à signature HMAC vérifiée N'EST PAS une route non protégée.
// Les classer ensemble produit 44 « trous » là où il y en a 27.
export const m14_apiGuards = {
  id: 'apiRoutesUnguarded',
  titre: 'Routes API sans garde ni signature',
  run(c) {
    const GARDE = /requireAdmin|adminAuthGuard|requireAny|assertRole|withAuth|verifyCaller/;
    const SIGNE = /createHmac|timingSafeEqual|stripe-signature|verifySignature|WEBHOOK_SECRET|svix/;
    const SECRET = /CRON_SECRET|x-cron|vercel-cron|x-api-key|tenantApiKey/;
    const PUBLIC_ASSUME = /@public-route/;   // marqueur explicite à poser — voir G.2
    const detail = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('route.ts')) continue;
      if (GARDE.test(src) || SIGNE.test(src) || SECRET.test(src) || PUBLIC_ASSUME.test(src)) continue;
      detail.push(c.rel(f));
    }
    return { valeur: detail.length, detail: detail.sort() };
  },
};
```

- **Baseline** : **27**, qui doit descendre à 0 — non pas en ajoutant des gardes partout,
  mais en **tranchant** chaque route : garde, signature, ou marqueur `@public-route`
  explicite avec justification (§ G.2).
- **Effort** : 2 h

---

## LOT R — Les 143 réglages qui ne pilotent rien

> Le lot au plus fort impact commercial du dépôt. Un gérant ouvre l'écran Paramètres,
> voit 190 leviers, en actionne un — et rien ne bouge.

### R.0 — `[ ]` La règle qui empêche la récidive

Avant toute correction, poser la règle dans `docs/CODING_STANDARDS.md` :

> **Un réglage n'entre dans `config-registry.ts` qu'accompagné de son lecteur.**
> La déclaration et la lecture sont livrées dans le même commit, ou aucune des deux.

Elle est rendue exécutoire par le cliquet `UNREAD_SETTINGS_MAX` une fois M.1 corrigé :
tout réglage ajouté sans lecteur fait monter le compteur et bloque le commit.

### R.1 — `[ ]` Trancher, page par page — la décision avant le code

Pour chacun des 143, **une seule des trois issues**, jamais une quatrième :

| Issue | Quand | Coût |
|---|---|---|
| **Brancher** | le comportement existe, il est juste codé en dur | faible à moyen |
| **Retirer du registre** | le comportement n'existe pas et n'est pas prévu à court terme | quasi nul |
| **Marquer `comingSoon`** | prévu, daté, avec un propriétaire — la case s'affiche **désactivée** avec une explication | faible |

> Le patron `comingSoon` existe déjà dans ce dépôt : il a été appliqué aux 7 connecteurs
> sans code (`quickbooks`, `xero`, `shopify`…). C'est la même honnêteté d'affichage, à
> transposer aux réglages. **Interdit** : laisser une case active qui ne fait rien.

**Ordre de traitement — les pages entièrement mortes d'abord.** Une page dont 100 % des
réglages sont morts est un écran de paramètres entièrement décoratif : c'est là que la
perte de confiance est maximale.

| Passe | Pages | Réglages morts | Effort |
|---|---|---:|---|
| 1 | `kitchen`, `staff`, `floor_plan`, `leaves`, `storage_map` | 44 | 2–3 j |
| 2 | `pos`, `kds` — écrans de service, forte visibilité | 22 | 2 j |
| 3 | `inventory`, `reservations`, `planning` | 35 | 2–3 j |
| 4 | `customer`, `haccp`, `finance`, `dashboard`, `bar` | 34 | 2–3 j |
| 5 | reliquat des 25 pages | 8 | 0,5 j |

### R.2 — `[ ]` Le patron de branchement

Un réglage branché doit l'être **du registre jusqu'au comportement**, sans intermédiaire
inventé. Le chemin qui marche déjà, à copier :

```ts
// 1. Déclaré — config-registry.ts, avec ses rôles (le registre porte déjà le RBAC)
{ key: "loyalty_points_per_euro", label: "Points par euro dépensé",
  group: "logic", type: "number", min: 0, max: 100, roles: ["admin", "directeur"] }

// 2. Lu — dans le service, pas dans le composant : le réglage pilote une RÈGLE MÉTIER
//    LoyaltyEngine.ts:20
function getPointsPerEuro(): number {
  return getSetting<number>('customer', 'loyalty_points_per_euro', 1);
}
```

**Deux règles de placement** :
- **Le lecteur va dans le service, pas dans le composant.** Un réglage lu dans un `.tsx`
  ne pilote que cet écran ; lu dans le service, il pilote la règle partout.
- **Toujours une valeur par défaut** — troisième argument. Un réglage jamais renseigné par
  le tenant ne doit pas faire tomber la fonctionnalité.

### R.3 — `[ ]` Vérifier le respect des rôles à la lecture

Le registre déclare déjà `roles: [...]` pour chaque réglage. À vérifier — ce n'est pas
mesuré à ce jour : **ces rôles filtrent-ils seulement l'affichage, ou aussi l'écriture ?**

Si un serveur peut écrire `ca_target` en appelant l'API directement parce que le filtrage
n'existe qu'à l'affichage, alors le registre décrit un RBAC qu'il n'applique pas.

- **Action** : lire `SettingsManager.saveSettings` et vérifier qu'il refuse une écriture
  dont le rôle de l'appelant ne figure pas dans `roles` du réglage. Sinon, l'ajouter.
- **Test à écrire** : un `serveur` qui écrit `ca_target` doit être rejeté côté service.
- **Effort** : 1 j

---

## LOT B — Le bus : 107 gestionnaires qui attendent pour rien

### B.1 — `[ ]` Les 107 événements écoutés sans producteur

Même discipline qu'en R.1 : **brancher, supprimer, ou marquer**.

**Commencer par ceux dont l'absence a une conséquence réglementaire ou financière** —
un gestionnaire écrit et jamais déclenché y équivaut à une obligation non tenue :

| Événement écouté, jamais émis | Ce qui n'arrive donc jamais |
|---|---|
| `cash_drawer.opened_unauthorized` | l'alerte d'ouverture de tiroir non autorisée |
| `cert.expired` | la relance sur un certificat expiré |
| `analytics.anomaly_detected` | la remontée d'anomalie |
| `commerce.promotion_expired` | la désactivation d'une promotion échue |
| `biggroup.confirmed` | la confirmation de grande tablée |

> Pour chacun : soit trouver l'endroit du code où la condition se produit et **émettre**,
> soit constater que la condition n'est jamais calculée — et alors ce n'est pas un
> problème de bus, c'est une fonctionnalité absente. Le distinguer est tout l'enjeu.

- **Effort** : 3–4 j pour les 20 premiers, le reste au fil de l'eau

### B.2 — `[ ]` Les 177 émis que personne n'écoute

Moins grave — une émission sans abonné ne casse rien — mais ce sont **310 appels** qui
coûtent du calcul et de l'écriture pour rien, et qui donnent l'illusion d'un système
réactif là où il n'y a qu'un journal.

- **Action** : distinguer les émissions **d'audit** (qui doivent rester : elles alimentent
  le journal WORM et la traçabilité) des émissions **de coordination** (qui attendent un
  abonné qui n'existe pas). Les premières restent, les secondes se branchent ou se retirent.
- **Effort** : 2 j de tri, puis au fil de l'eau

### B.3 — `[ ]` Les 74 contrats d'événements morts

Déclarés dans `shared/eventBus/events/`, ni émis ni écoutés. Concentrés sur `health` (11),
`auto` (9), `bakery` (7), `hotel` (7) — les verticales déclarées avant d'être implémentées.

- **Action** : les retirer, ou les marquer comme contrat de verticale non encore livrée.
  Un contrat mort dans un fichier de contrats fait croire que la verticale est plus
  avancée qu'elle ne l'est — y compris à toi, dans six mois.
- **Effort** : 0,5 j

### B.4 — `[ ]` Protéger les 8 émissions à nom calculé

`NexusEventBus.emit(entry.eventName as NexusEventName, …)` dans le rejeu DLQ, l'outbox et
`ServerEventBus`. C'est **légitime** — c'est même le cœur de la reprise sur incident. Mais
le `as NexusEventName` contourne le typage : un nom d'événement corrompu en base sera émis
sans que rien ne proteste.

- **Action** : valider le nom contre la liste des événements connus **avant** d'émettre,
  et router vers la DLQ en cas de nom inconnu plutôt que d'émettre dans le vide.
- **Fichiers** : `src/lib/sync/outboxReplayer.ts`, `src/shared/eventBus/ServerEventBus.ts`,
  `src/app/api/admin/dlq/replay/route.ts`, `src/app/api/admin/dlq/replay-batch/route.ts`.
- **Effort** : 0,5 j

---

## LOT G — Les gardes

### G.1 — `[ ]` Clarifier la couverture réelle des pages

47 % des pages portent `withPageGuard`, mais le chiffre brut ne veut rien dire : le groupe
`(admin)` est gardé au niveau du layout (`ADMIN_ROLES`), et les pages publiques n'ont
évidemment pas à l'être.

- **Action** : classer les 84 pages en trois familles — **gardée par le layout**,
  **gardée par `withPageGuard`**, **publique assumée** — et faire de cette classification
  un test d'architecture, pas un tableau dans un document.
- **À vérifier en premier** : les écrans `(client)/(ops)` n'ont **pas** de layout de groupe
  avec garde de rôle. S'ils dépendent d'un `AuthGate` monté ailleurs, il faut savoir
  lequel et le prouver par un test, pas le supposer.
- **Effort** : 1 j

### G.2 — `[ ]` Trancher les 27 routes sans protection visible

Une par une, avec issue explicite. Celles qui demandent une décision urgente :

| Route | Pourquoi c'est sensible |
|---|---|
| `api/tenant/contracts/[contractId]/sign/route.ts` | **signature de contrat** |
| `api/push/send/route.ts` | envoi de notifications aux utilisateurs |
| `api/mcc/contracts/route.ts` | données de niveau flotte |
| `api/billing/signup/route.ts` | création d'abonnement |
| `api/facility/hardware/diagnostics/route.ts` | diagnostic matériel |
| `api/haccp/iot-push/route.ts` | ingestion de relevés réglementaires |
| `api/finance/bank/callback/route.ts` | retour bancaire |
| `api/auth/google/callback/route.ts` | retour d'authentification |

Les autres sont probablement publiques à dessein — `api/health`, `api/status/*`,
`api/menu.json`, `api/resolve-domain`, `api/v1/openapi.json`. **Elles doivent le déclarer** :
poser un commentaire `@public-route` avec la raison, que la mesure M.3 reconnaîtra.
Une route publique assumée et une route oubliée se ressemblent aujourd'hui à s'y méprendre.

- **Effort** : 2–3 j

### G.3 — `[ ]` Couvrir les actions sensibles, pas seulement les pages

`<ActionGuard>` n'est utilisé que **12 fois dans 11 fichiers**. Une page peut être
accessible à un rôle sans que **toutes** ses actions le soient — annuler une vente,
ouvrir le tiroir, modifier un objectif, valider un transfert.

- **Action** : lister les actions à conséquence financière, fiscale ou RH, et vérifier que
  chacune passe par `ActionGuard` ou par une garde serveur. Les réservations, notamment,
  ne sont couvertes par aucune des deux à ce jour.
- **Rappel** : `ActionGuard` sait afficher un contrôle **désactivé avec un motif**
  (`disabledMode`, `aria-disabled`, `disabledReason` — invariant INV-22). C'est mieux que
  de masquer : le staff comprend pourquoi il ne peut pas, au lieu de croire à un bug.
- **Effort** : 2–3 j

---

## LOT H — Hygiène

### H.1 — `[ ]` Les 77 composants sans consommateur

Trois issues, comme partout : **monter**, **marquer `@wip`** (avec propriétaire et
échéance — la mesure les exclut déjà), ou **supprimer**.
Concentration mesurée : `compliance` 23, `commerce` 14, `shared/components` 11.
Commencer par `compliance` : un composant non monté y laisse croire qu'une obligation
réglementaire est couverte.

### H.2 — `[ ]` Les 27 collisions de noms

Deux composants différents exportés sous le même nom. Effet : un import qui « marche »
mais ramène le mauvais, et une recherche dans le code qui ment. À renommer par domaine.

### H.3 — `[ ]` Les 198 erreurs potentiellement avalées

Dont 7 `catch` vides et 28 `catch` avec un simple commentaire. Chaque `catch` silencieux
est un futur « ça ne marche pas et on ne sait pas pourquoi ».

**Règle** : un `catch` fait au minimum l'une des trois choses — journaliser avec contexte,
remonter à l'utilisateur, ou écrire en DLQ. Jamais rien.
Le cas `axe-config.ts` en est l'archétype et est déjà traité au plan UI/UX.

### H.4 — `[ ]` Trancher les trois langues à 28 %

`es`, `pt`, `ja` sont à 337 clés manquantes chacune. Une langue à 28 % affiche des clés
brutes à l'écran : c'est pire que son absence. **Compléter ou retirer du sélecteur.**
Le `fr` est complet (0 clé appelée absente) — le socle est sain.
Ne jamais traduire les libellés réglementaires (NF525, FEC, PCG).

---

## 2. Séquencement

### Sprint 1 — réparer l'instrument (2 j)
`M.1` · `M.2` · `M.3` · `R.0`
→ Les compteurs disent la vérité, trois nouveaux cliquets sont armés, la règle
« pas de réglage sans lecteur » est opposable. **`unreadSettings` tombe de 177 à 146 sans
qu'une seule ligne de produit ne bouge** — parce que 31 réglages étaient déjà branchés et
que la mesure ne les voyait pas.

### Sprint 2 — ce que le client voit et ce qui engage (8 j)
`R.1` passes 1–2 (66 réglages) · `G.2` (les 8 routes sensibles) · `B.1` (les 5 événements
à conséquence réglementaire)
→ Les écrans de paramètres entièrement décoratifs disparaissent, les routes qui engagent
juridiquement sont gardées.

### Sprint 3 — le reste du câblage (10 j)
`R.1` passes 3–5 · `R.3` · `B.1` suite · `G.1` · `G.3`

### Ensuite
`B.2` · `B.3` · `B.4` · `H.1` → `H.4`

---

## 3. Critères de sortie

1. `[ ]` `npm run measure` : `unreadSettings` ≤ 20, et chaque réglage restant est soit
   branché, soit marqué `comingSoon`, soit retiré
2. `[ ]` `busOrphanEvents` = 0 — plus aucun gestionnaire n'attend un événement qui n'existe pas
3. `[ ]` `apiRoutesUnguarded` = 0 — chaque route a une garde, une signature, ou un
   `@public-route` justifié
4. `[ ]` Les 84 pages sont classées et la classification est **testée**, pas documentée
5. `[ ]` `SettingsManager` refuse une écriture dont le rôle n'est pas dans `roles`
6. `[ ]` Les 8 émissions à nom calculé valident le nom avant d'émettre
7. `[ ]` Aucun `catch` vide dans `src/` ; les 198 sont tombés sous 50
8. `[ ]` `.gate-baseline.json` re-figé **à la baisse** à chaque étape

> **Rappel Loi 2** — un seuil ne monte jamais. Note que M.1 fait **baisser** le compteur
> (177 → 143) : corriger un motif trop laxiste est toujours autorisé. C'est l'inverse —
> un motif corrigé qui fait **monter** le compteur — qui exige un nouvel `id` et sa
> propre baseline, jamais un relèvement de seuil.

---

## Annexe — commandes de vérification

```bash
npm run measure                        # 13 mesures aujourd'hui, 16 après le LOT M
npm run preflight                      # gate complète, cliquets compris
node scripts/gate-last-mile.mjs        # Gate 6 seule
node scripts/verify-gate-integrity.mjs # refuse tout desserrement de seuil
npx vitest run                         # 2 438 tests + 1 ignoré au 2026-08-27
```

---

*Plan établi le 2026-08-27. Toutes les mesures prises en session sur un arbre en cours de
modification par une session parallèle — les re-mesurer avant d'agir (Loi 7).*
