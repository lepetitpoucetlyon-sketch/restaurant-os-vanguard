# Plan d'action unifié — Audit verticale restaurant + 23 axes

> Rédigé le **2026-08-25** · état mesuré sur `main@0e93408d0`
> Fusionne : `AUDIT-VERTICALE-RESTAURANT-2026-08-25.md` (5 axes) et `AUDIT-23-AXES-2026-08-25.md`
> **Ce plan est conçu pour une exécution multi-agents.** L'analyse des conflits (Partie 1)
> est aussi importante que la liste des tâches — c'est elle qui évite que deux sessions
> se détruisent mutuellement.

---

# PARTIE 0 — État réel au moment de la rédaction

**Re-mesuré avant de planifier.** Antigravity a exécuté `trilogy-execution-sprint2`
(désormais `terminée`) pendant la rédaction des audits — planifier du travail déjà fait
aurait été le premier conflit.

| Finding d'audit | État mesuré | Reste à faire |
|---|---|---|
| Overrides nav `hotel`/`bakery`/`retail`/`custom` | ✅ **Les 4 présents** | Rien |
| Templates SMS dé-teintés | 🟡 **Partiel** — « table » → « réservation », alias `{etablissement}` ajouté dans `ReservationTemplateFormatter.ts:90` | Les défauts utilisent encore `{restaurant}` · **`{couverts}` reste** teinté restaurant |
| `FISCAL_SIGNING_SECRET` | 🟡 Génération + doc `.env.example` | **Reste à générer et poser en environnement** |
| Microunits Lot 2 | 🟡 Jumeaux `api.contracts.ts` complétés | Compteur toujours à **821** — la suppression des miroirs n'a pas commencé |
| `atomic/` supprimé | ❌ Existe toujours | Lot 3 restaurant |
| `useLexicon()` branché | ❌ **0 consommateur** | Lot 1 restaurant |
| `error.tsx` | ❌ **0 fichier** | Sprint A |
| Routes API sans guard | 🟡 **39** (était 44) | Sprint A |
| `PrintingService` gestion d'erreur | ❌ 2 occurrences | Sprint A |

**Leçon immédiate :** entre la rédaction d'un audit et son exécution, l'état bouge.
Toute vague de ce plan **doit commencer par re-mesurer ses propres cibles** (Loi 7).

---

# PARTIE 1 — Analyse des conflits

C'est la partie que la plupart des plans oublient. Cinq familles de conflits ont été
identifiées, chacune avec une parade.

---

## Conflit type 1 — Sessions fantômes (protocole dégradé) 🔴

**Constat mesuré :** 3 sessions sont marquées `active` dans `.claude/sessions.md` alors
que leurs descriptions disent « LIVRÉS » :

| Session | Date | Périmètre revendiqué | Réalité |
|---|---|---|---|
| `restaurant-ui-refonte` | 2026-08-24 | très large (P-1 sécurité, RBAC, dette P1) | Description : « LIVRÉS » |
| `antigravity-scrapling-nav` | 2026-08-23 | `shared/components/layout/*`, **`navConfig.ts`** | Antigravity a modifié `navConfig.ts` **depuis une autre session** |
| `item2-3-perf-parite` | 2026-08-22 | **`scripts/preflight.sh`**, `.gate-baseline.json`, 4 verticales | Antigravity a modifié `preflight.sh` **depuis une autre session** |

**Pourquoi c'est grave :** le hook `check-session-collision.sh` bloque les écritures dans
le périmètre d'une session active. Avec 3 sessions fantômes couvrant `navConfig.ts` et
`preflight.sh`, soit le hook bloque du travail légitime, soit il a été contourné — dans
les deux cas le garde-fou ne protège plus rien.

> **Parade — action VAGUE 0 :** clôturer les 3 sessions fantômes avant toute autre chose.
> Une session sans commit depuis 24 h passe automatiquement en `terminée`.

---

## Conflit type 2 — Index git partagé entre agents 🔴

**Constat vécu aujourd'hui :** le fichier `AUDIT-VERTICALE-RESTAURANT-2026-08-25.md` a été
**absorbé par le commit d'un autre agent** (`189f260a3 feat(guards): ajout du hook
zero-claim-guard.sh`). Rien n'a été perdu, mais le message de commit ne décrit pas son contenu.

**Mécanisme :** `sessions.md` coordonne le périmètre de *fichiers*, pas l'*index git*.
Deux agents qui font `git add` puis `git commit` se volent mutuellement leurs fichiers stagés.

> **Parade — règle à inscrire dans `AGENTS.md` :**
> ```bash
> # ❌ jamais
> git add -A && git commit -m "…"
> # ✅ toujours : chemins explicites, staging et commit atomiques
> git commit -- <fichier1> <fichier2> -m "…"
> ```
> Corollaire : ne jamais `git add .` ni `git add -A` sur ce repo.

---

## Conflit type 3 — Corrections qui se contredisent techniquement 🔴

C'est le conflit le plus dangereux : deux tâches légitimes qui s'annulent.

### 3.1 — Imports POS : cycles ↔ barrel *(piège actif)*

`src/modules/ops/service/pos/hooks/usePos.ts` importe aujourd'hui en profondeur :
```typescript
import { useOrders }   from '../../../providers/hooks/kitchenHooks';
import { useTables }   from '../../../providers/hooks/floorHooks';
import { useProducts } from '../../../providers/hooks/catalogHooks';
```

C'est une **violation du barrel assumée et délibérée**. Elle a été rétablie sciemment le
2026-08-25 : passer par `'../../../providers'` **ferme un cycle** détecté par sentrux.

> 🔴 **Piège :** toute session « nettoyage des barrel violations » qui corrigerait ces
> 3 lignes réintroduirait le cycle. Le correctif paraît évident et il est faux.
>
> **Parade :** inscrire ces 3 lignes dans `docs/BARREL-EXCEPTIONS.md` avec la justification
> anti-cycle, comme les 7 imports `store/pillars/*`. **À faire en VAGUE 0** — c'est une
> mine posée dans le code.

### 3.2 — `error.tsx` du POS ↔ migration microunits

L'`error.tsx` du POS (Sprint A) doit **sauvegarder le panier** avant d'afficher l'erreur —
il touche donc `posAtoms` / `orderAtoms` / `CartItem`.
La migration microunits Lot 4 touche exactement les mêmes structures (`unitPriceInCents`,
`totalInCents`, `cartTvaInCents`).

> **Parade :** `error.tsx` d'abord (il ne fait que **lire** l'atome), microunits ensuite.
> Ne jamais paralléliser ces deux tâches.

### 3.3 — Multi-pays ↔ conformité NF525

Rendre `TaxRateGuard` configurable par tenant (axe 13) affaiblit mécaniquement une garde
écrite pour le contrôle DGFiP :
> refuse la validation si UN item n'a pas de `taxRate` dans `["0.055","0.10","0.20","0.00"]`
> (taux ORTA France 2026)

> **Parade :** si ouverture multi-pays, la garde devient **par juridiction**, jamais
> « désactivable ». Un tenant France garde exactement les taux ORTA. Décision produit
> avant décision technique.

### 3.4 — Rangement `ui/` ↔ passe accessibilité

Le Lot 3 restaurant renomme 11 fichiers de `ui/` (casse) et déplace `atomic/`.
La passe a11y (Sprint C) modifie le contenu de ces mêmes fichiers.

> **Parade :** renommages **avant** modifications de contenu. Un `git mv` suivi d'une
> édition se relit ; l'inverse produit des diffs illisibles.

---

## Conflit type 4 — Dépendances de séquencement 🟠

Certaines tâches n'ont aucun sens avant d'autres :

| Tâche | Dépend de | Pourquoi |
|---|---|---|
| Instrumenter Sentry | `error.tsx` créés | Rien à instrumenter sans point de capture |
| Test E2E parcours client | `FISCAL_SIGNING_SECRET` posé | Le scellement échoue sans lui → test rouge pour la mauvaise raison |
| Test E2E parcours client | `_demo_restaurant` provisionné | Pas de tenant à exercer |
| Ratchet bundle | Aucune session sur `preflight.sh` | Fichier à écrivain unique |
| Brancher `useLexicon()` | Décision multi-pays **non requise** | Indépendant — peut avancer en parallèle |
| Suppression miroirs microunits | Tous les consommateurs migrés | Sinon `tsc` explose |

---

## Conflit type 5 — Priorité audit ↔ priorité business 🟠

**Le conflit de fond.** Les deux audits produisent 8-10 + 11-14 sessions de travail.
Or le constat le plus important de la journée est ailleurs :

> 326 000 lignes · 12 verticales · **0 client**.

Certains axes **ne peuvent pas être validés sans client réel** :
- résilience offline → il faut un vrai wifi de restaurant qui tombe
- matériel dégradé → il faut une vraie imprimante qui manque de papier
- coûts par tenant → il faut un vrai usage à mesurer
- parcours bout-en-bout → il faut un vrai parcours

> **Parade — arbitrage explicite :** ce plan ne s'exécute **pas intégralement avant** le
> premier client. Seule la **Vague 1** est un préalable. Les vagues 2 et 3 s'exécutent
> **pendant** le pilote, informées par ce qu'il révèle.

---

# PARTIE 2 — Le plan séquencé

Quatre vagues. Chacune est un **jalon business**, pas une liste de tâches.

---

## VAGUE 0 — Désamorçage *(1 session · à faire en premier, sans exception)*

*Objectif : rendre le terrain sûr pour toutes les vagues suivantes.*

| # | Action | Fichier | Pourquoi maintenant |
|---|---|---|---|
| 0.1 | **Sauvegarder le dépôt** | — | 66 commits n'existent que sur une machine |
| 0.2 | Clôturer les 3 sessions fantômes | `.claude/sessions.md` | Le hook de collision ne protège plus rien |
| 0.3 | Documenter les 3 imports POS anti-cycle | `docs/BARREL-EXCEPTIONS.md` | Mine posée : le « correctif évident » réintroduit un cycle |
| 0.4 | Règle `git commit -- <fichiers>` | `AGENTS.md` | Les commits d'agents s'absorbent mutuellement |

```bash
git bundle create ~/Desktop/restaurant-os-backup-$(date +%Y%m%d).bundle --all
```

**Critère de sortie :** sauvegarde faite · 0 session fantôme · 3 imports documentés · règle inscrite.

---

## VAGUE 1 — Prêt pour un pilote *(4-5 sessions · préalable au premier client)*

*Objectif : qu'un restaurateur puisse utiliser le produit une semaine sans que ça casse
de façon irrécupérable.*

### 1.1 — Pages d'erreur *(1 session)* 🔴 **priorité absolue**

Défaut le plus visible, correction la moins chère.

```
src/app/global-error.tsx                 → filet ultime
src/app/not-found.tsx                    → 404 métier
src/app/(client)/(ops)/error.tsx         → erreur métier + « Réessayer »
src/app/(client)/(ops)/pos/error.tsx     → SPÉCIFIQUE : préserve le panier
src/app/(admin)/error.tsx
```

L'`error.tsx` du POS **lit** `activeCartAtom` (jamais n'écrit — cf. conflit 3.2) et propose
« Reprendre la commande ».

*Critère :* provoquer une erreur sur `/pos` → écran métier, panier récupérable, pas d'écran blanc.

### 1.2 — Routes API sensibles *(1 session)* 🔴

Ordre par risque décroissant :
1. **`haccp/iot-push`** — token de service par device. *Un tiers peut falsifier des relevés
   de température ; le registre HACCP fait foi en contrôle sanitaire.*
2. `cron/daily-backup` · `cron/weekly-report` — secret de cron
3. `widget/setup-intent` — limitation de débit + validation d'origine
4. Vérifier la signature des 6 webhooks (`stripe`, `thefork`, `google-reserve`, `docuseal`, `sms/inbound`, `delivery/[provider]`)

*Critère :* un test qui échoue si une route hors liste blanche explicite n'a aucun garde.
Compteur cible : **39 → ≤ 20** (les publiques légitimes).

### 1.3 — Résilience d'impression *(1 session)* 🔴

File d'attente persistée + retry borné + alerte visible en caisse.
Trancher explicitement : **ticket scellé, impression échouée → que voit le client ?**

*Critère :* débrancher l'imprimante en plein service → ticket en file, opérateur prévenu, rien perdu.

### 1.4 — `FISCAL_SIGNING_SECRET` posé *(0,5 session)* 🔴

Antigravity a livré la génération et la doc. **Reste à le poser en environnement.**
Sans lui, aucune vente n'est scellable — bloqueur légal.

### 1.5 — Sentry branché *(0,5 session)*

Dépend de 1.1. Instrumenter les `error.tsx` + les routes API critiques.

*Critère :* une erreur provoquée apparaît dans Sentry avec tenant et route.

### 1.6 — Provisionner `_demo_restaurant` / `_ref_restaurant` *(0,5 session)*

Prérequis de toute démo commerciale **et** du test E2E de la vague 2.

---

## VAGUE 2 — Pendant le pilote *(4-5 sessions)*

*Objectif : instrumenter et durcir ce que le terrain révèle. Ces tâches gagnent
énormément à être faites **avec** un vrai usage sous les yeux.*

### 2.1 — Parcours client bout-en-bout *(1,5 session)* ⭐

Un test Playwright de l'inscription à la clôture de caisse :
```
inscription → Stripe → provisioning → seeding → connexion → carte
→ première vente → scellement NF525 → impression → clôture
```
Dépend de 1.4 et 1.6.

> **C'est le test qui vaut le plus cher du projet** — le seul qui valide l'assemblage
> plutôt que les pièces.

### 2.2 — Offline / Outbox / DLQ *(2 sessions)*
Scénarios : coupure 4 h en plein service · DLQ pleine · conflit deux serveurs ·
rejeu désordonné (le hash NF525 tient-il ?).
**À écrire pendant le pilote**, calibré sur les vraies coupures observées.

### 2.3 — Journée fiscale & timezone *(1 session)*
Service 19h → 01h : la clôture regroupe-t-elle correctement ?
352 `new Date()` contre 16 fichiers TZ-aware — centraliser le domaine fiscal derrière `TimeSync`.

### 2.4 — `npm audit` en gate *(0,5 session)*
Traiter les 11 `high`, poser un ratchet dans `preflight.sh`.
⚠️ **Écrivain unique sur `preflight.sh`** (cf. conflit 4).

---

## VAGUE 3 — Durcissement *(5-6 sessions)*

*Objectif : ce qui se voit à l'usage prolongé, pas à la première semaine.*

| # | Tâche | Sessions | Note de conflit |
|---|---|---|---|
| 3.1 | Rangement `ui/` (casse, `atomic/`, racine) | 1,5 | **Avant** 3.2 (cf. conflit 3.4) |
| 3.2 | Accessibilité — POS, KDS, plan de salle | 2 | Après 3.1 |
| 3.3 | Brancher `useLexicon()` (6 écrans) | 2 | Indépendant — parallélisable |
| 3.4 | Tests flaky (`PosFiscalSealE2EPipeline`) | 1 | Chemin fiscal — à comprendre |
| 3.5 | RGPD allergènes (donnée de santé) | 1 | Rétention · effacement · journal d'accès |
| 3.6 | Ratchet bundle (gate 9 annoncée) | 0,5 | `preflight.sh` — écrivain unique |
| 3.7 | PRA : restaurer une sauvegarde | 1 | Une sauvegarde jamais restaurée n'en est pas une |

---

## VAGUE 4 — Décisions stratégiques *(arbitrage, pas exécution)*

Ces quatre points ne sont **pas des tâches** : ce sont des décisions à prendre,
dont découleront des chantiers.

| Décision | Enjeu | Coût si « oui » |
|---|---|---|
| **Plafonds de coût par tenant** | *Combien te coûte un client par mois ?* Aujourd'hui le code ne permet pas de répondre. | 2 sessions |
| **Multi-pays** | 129 `EUR` · 209 TVA · 177 `fr-FR`. Traduire l'UI ne sert à rien si la caisse ne facture qu'en TVA française. | 5-8 sessions |
| **Auth agnostique** | 17 fichiers Firebase, aucune `IAuthProvider`. Un client exigeant du SSO ? | 3-4 sessions |
| **Migration microunits (821)** | Dette de fond, zéro valeur client immédiate | 9-11 sessions |
| **Audit des 11 autres verticales** | Le restaurant a révélé 5 écarts ; les autres sont moins exercées | 3-4 sessions |

> **Recommandation :** ne rien lancer ici avant d'avoir un client. Le plafond de coût
> devient urgent au 3ᵉ client, pas au 1ᵉʳ.

---

# PARTIE 3 — Règles d'exécution multi-agents

À inscrire dans `AGENTS.md`. Elles découlent directement des conflits observés aujourd'hui.

### R1 — Re-mesurer avant d'exécuter
Toute vague commence par re-mesurer ses cibles. Aujourd'hui, 4 findings sur 9 avaient
déjà bougé entre l'audit et l'exécution.

### R2 — Commits atomiques à chemins explicites
```bash
git commit -- <fichiers> -m "…"     # ✅
git add -A && git commit            # ❌ vole les fichiers des autres agents
```

### R3 — Écrivain unique sur les fichiers de gate
`scripts/preflight.sh` · `.sentrux/rules.toml` · `.gate-baseline.json` :
un seul agent à la fois, toujours.

### R4 — Clôture automatique des sessions
Une session sans commit depuis 24 h passe en `terminée`. Une session fantôme est pire
qu'aucune session : elle donne une fausse sécurité.

### R5 — Vérifier `BARREL-EXCEPTIONS.md` avant tout « nettoyage d'imports »
Certaines violations sont délibérées et anti-cycle. Le correctif évident est parfois faux.

### R6 — Renommer avant de modifier
`git mv` puis édition. Jamais l'inverse.

---

# PARTIE 4 — Matrice de dépendances

```
VAGUE 0 ─────────────────────────────────────────► (bloque tout)
  0.1 sauvegarde
  0.2 sessions fantômes
  0.3 BARREL-EXCEPTIONS (imports POS)
  0.4 règle git

VAGUE 1
  1.1 error.tsx ──────┬──► 1.5 Sentry
  1.2 routes API      │
  1.3 impression      │
  1.4 FISCAL_SECRET ──┼──► 2.1 E2E
  1.6 _demo_ tenant ──┘

VAGUE 2
  2.1 E2E  ◄── dépend de 1.4 + 1.6
  2.2 offline/DLQ
  2.3 timezone
  2.4 npm audit ◄── écrivain unique preflight.sh

VAGUE 3
  3.1 rangement ui/ ──► 3.2 a11y     (ordre obligatoire)
  3.3 lexique        (parallélisable)
  3.4 flaky · 3.5 RGPD · 3.7 PRA     (parallélisables)
  3.6 ratchet bundle ◄── écrivain unique preflight.sh

VAGUE 4 : décisions, pas exécution
```

**Chemin critique :** `0.x → 1.1 → 1.5` et `1.4 + 1.6 → 2.1`.

---

# PARTIE 5 — Critères de sortie

| Vague | Critère vérifiable | Commande |
|---|---|---|
| 0 | Bundle créé · 0 session fantôme · 3 imports documentés | `git bundle` · `grep -c "active" sessions.md` |
| 1 | Erreur sur `/pos` → écran métier · ≤ 20 routes sans guard · imprimante débranchée sans perte · secret posé | test manuel + test de garde |
| 2 | E2E vert de l'inscription à la clôture · coupure 4 h rejouée · service 19h-1h clôturé juste · `high` npm ≤ 11 | `npx playwright test` · `npm audit` |
| 3 | Casse unique dans `ui/` · POS navigable au clavier · ≥ 20 consommateurs `useLexicon` · 0 flaky · sauvegarde restaurée | `HEALTH.md` |
| 4 | Chaque décision tranchée et **écrite** | `docs/adrs/` |

---

# Synthèse

**Ce qui bloque un premier client :** la Vague 0 et la Vague 1. **5-6 sessions.**

**Ce qui n'est pas dans ce plan et compte davantage :** trouver ce client.
Les vagues 2 et 3 seront meilleures écrites avec un vrai service sous les yeux —
un wifi qui tombe vraiment, une imprimante qui manque vraiment de papier.

**Le risque principal de ce plan est de l'exécuter en entier avant d'avoir un utilisateur.**
Ce serait ajouter 15 sessions de robustesse à un produit dont personne n'a encore
validé l'usage.

---

*Ground truth re-mesuré le 2026-08-25 sur `main@0e93408d0`. Les états de la Partie 0
sont périssables — les re-mesurer avant exécution (règle R1).*
