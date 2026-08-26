# Plan Angles Morts — ce que les gates ne voient pas

> **Objet** : traiter les classes de défaut invisibles à `tsc`, aux tests, à `madge` et à Sentrux —
> celles où **le code est correct et le produit inutilisable**.
> **Branche** : `fix/split-bill-inerte` · **Date** : 2026-08-26
> **Loi 7 (Zero-Claim)** : chaque chiffre est mesuré en session, commande reproductible fournie.
> **Emplacement** : racine du dépôt (`docs/` = périmètre actif de `impl-scripts-mesure`).
> **Troisième document** d'une série à périmètres disjoints :
> `PLAN-UNIFICATION-THEME-2026-08-26.md` · `PLAN-LAYOUT-MOBILE-PWA-2026-08-26.md`

---

## 0. Le critère manquant

Les gates existantes vérifient que le code est **correct** :

| Vérifié aujourd'hui | Jamais vérifié |
|---|---|
| `tsc` : 0 erreur | Que voit l'utilisateur quand la liste est **vide** ? |
| 2 394 tests verts | Le texte est-il **traduisible** ? |
| 0 cycle `madge` | La date a-t-elle un **fuseau** ? |
| Sentrux : aucune dégradation | Le bouton affiché est-il **autorisé** ? |
| Gate 6 « dernier kilomètre » | La saisie est-elle **protégée** ? |

Les 9 angles morts ci-dessous ont tous la même signature :
**tout compile, tout passe les tests, et le produit ne fonctionne pas pour la personne devant l'écran.**

Base de mesure : **907 fichiers `.tsx`**.

---

## 1. Tableau de bord des angles morts

| # | Angle mort | Mesure | Gravité |
|---|---|---|---|
| 1 | États vides / chargement | 497 fichiers avec `.map()` · **2** `<EmptyState>` · **3** `<Skeleton>` | 🔴 |
| 2 | i18n réel | **32** fichiers utilisent `t()` (3,5 %) · **964** chaînes FR en dur | 🔴 |
| 3 | Fuseau horaire | **1 210** `new Date()` bruts · **5** fichiers TZ-aware | 🔴 |
| 4 | RBAC dans l'UI | 48 décisions RBAC · **3** fichiers gardent une permission à l'écran | 🟠 |
| 5 | Accessibilité | `aria-*` dans **36**/907 (4 %) · `role=` **16** · **2** tests · **17** `<div onClick>` | 🟠 |
| 6 | Perte de saisie | **27** formulaires · **1** garde « non enregistré » | 🟠 |
| 7 | Coût client | **779**/907 `'use client'` (86 %) · **25** `next/dynamic` · **17** `<img>` bruts | 🟠 |
| 8 | Pages d'erreur | **3** `error.tsx` pour ~75 routes | 🟡 |
| 9 | ~~Fuites d'intervalles~~ | **écarté après vérification** — voir §11 | ⚪ |

---

## 2. LOT A — États vides, chargement, erreur 🔴

### 2.1 Constat

```bash
grep -rl "\.map(" src --include="*.tsx" | wc -l              # 497
grep -rl "<EmptyState" src --include="*.tsx" | wc -l         # 2
grep -rl "<Skeleton\|<LoadingState" src --include="*.tsx" | wc -l  # 3
```

Les composants **existent** et sont bien conçus (`src/shared/components/ui/EmptyState.tsx`,
API : `icon` · `title` · `description` · `action`), mais ne sont **branchés quasiment nulle part**.
Même motif que `InstallPrompt`, `useLexicon`, `NF525SelfAudit` : **construit, jamais branché**.

### 2.2 Pourquoi c'est le plus grave

C'est **l'incident vécu le 2026-08-26** : l'app affichait des écrans blancs faute de données
locales. Le diagnostic humain a été « rien ne marche », alors que l'app fonctionnait.
Un simple *« Aucun produit — importez votre carte »* aurait évité toute la séquence.

Trois états manquent partout : **chargement** (squelette), **vide** (explication + action),
**erreur** (cause + reprise). Aujourd'hui les trois rendent le même écran : **rien**.

### 2.3 Actions

1. Établir la règle : *toute liste rendue par `.map()` doit gérer les 3 états*.
2. Créer un composant enveloppe pour éviter 497 branchements manuels :
   ```tsx
   <DataView state={...} empty={{icon, title, description, action}} skeleton={<SkeletonList/>}>
     {items.map(...)}
   </DataView>
   ```
3. **Ordre de branchement** (par exposition) : POS → KDS → Plan de salle → Stocks →
   Réservations → Réglages → reste.
4. Rédiger des textes d'état **utiles** : ce qui manque **et** l'action suivante
   (jamais « Aucune donnée » seul).

### 2.4 Critères d'acceptation

- [ ] Aucun écran ne rend un vide silencieux sur les parcours POS / KDS / Stocks.
- [ ] Chaque état vide propose une **action** ou explique **pourquoi** c'est vide.
- [ ] L'état de chargement est distinct de l'état vide.

---

## 3. LOT B — i18n : la parité mesurait la mauvaise chose 🔴

### 3.1 Constat

```bash
grep -rl "\bt(['\"]" src --include="*.tsx" | wc -l   # 32  (3,5 % des fichiers)
grep -rhoE ">[A-ZÉÈÀÇ][a-zéèêàçûôî]+( [a-zéèêàçA-ZÉÈ']+){1,6}<" src --include="*.tsx" | wc -l  # 964
```

L'audit précédent mesurait la **parité des clés déclarées** (fr 468 · en 472 · es/pt/ja ~131).
Mais **96 % des fichiers n'appellent jamais `t()`** : **964 chaînes françaises sont écrites en dur
dans le JSX**.

> **Conséquence** : compléter les 337 clés manquantes par locale **ne traduirait presque rien**.
> On remplissait un seau qui ne contient que ~4 % du texte affiché.

### 3.2 Nuance à respecter

`CLAUDE.md` l'impose : **ne jamais traduire** les libellés réglementaires (NF525, FEC, PCG), qui
doivent rester en français légal. L'extraction doit donc **exclure** ces zones, pas les traduire.

### 3.3 Actions

1. **Re-mesurer la vraie couverture** : `fichiers avec t()` ÷ `fichiers avec du texte affiché`
   — et publier **ce** chiffre, pas la parité des clés.
2. Extraire par **surface d'exposition**, pas par fichier : POS, KDS, plan de salle, réservations
   (vus par le personnel et les clients) avant les écrans d'administration.
3. Marquer explicitement les zones réglementaires **non traduisibles**
   (commentaire + exclusion de l'outil d'extraction).
4. Ne compléter les locales `es/pt/ja` **qu'après** l'extraction — sinon on traduit un sous-ensemble
   non représentatif.

---

## 4. LOT C — Fuseau horaire & journée fiscale 🔴

### 4.1 Constat

```bash
grep -rho "new Date()" src --include="*.ts" --include="*.tsx" | wc -l   # 1210
grep -rl "timeZone\|Intl.DateTimeFormat\|date-fns-tz\|utcToZoned" src --include="*.ts" --include="*.tsx" | wc -l  # 5
```

**1 210** horodatages non qualifiés contre **5** fichiers conscients du fuseau.

### 4.2 Pourquoi c'est un risque fiscal, pas un détail

Un service qui se termine à 1 h du matin : la vente appartient-elle à la journée fiscale de la
veille ou du jour ? Avec `new Date()` brut, la réponse dépend du fuseau **de la machine qui
exécute le code** (navigateur du terminal, ou serveur en UTC).

Impacts : rattachement des `journalEntries`, bornes de la clôture Z, exports FEC, chaîne de
scellement `fiscalSeals`. Le système est **immuable par conception** — une erreur de rattachement
ne se corrige pas par un `update`.

### 4.3 Actions

1. **Décider et documenter** la règle de journée fiscale (heure de bascule, fuseau de référence :
   celui de l'établissement, pas du terminal).
2. Introduire un helper unique — `fiscalNow()` / `fiscalDayOf(date, tenant)` — et **interdire**
   `new Date()` dans les chemins fiscaux (finance, NF525, clôture, FEC).
3. Traiter par ordre de risque : **fiscal** → planning/RH (heures travaillées) → analytique → reste.
4. Ajouter un test sur le cas limite : vente à 23 h 58 et à 00 h 02, même service.

---

## 5. LOT D — RBAC affiché vs autorisé 🟠

### 5.1 Constat

```bash
grep -rl "can(\|hasPermission\|<RoleAwareView\|minLevel" src --include="*.tsx" | wc -l   # 3
```

**48 décisions RBAC** sont configurées et respectées côté services, mais **3 fichiers seulement**
conditionnent l'affichage. `RoleAwareView.tsx` existe dans `ui/` — encore un composant **peu branché**.

`navConfig.ts` filtre bien la **navigation** (`minLevel`, `requiredCapability`) : le trou est
**à l'intérieur des pages** (boutons d'action, onglets, menus contextuels).

### 5.2 Conséquence terrain

Un serveur voit « Annuler la commande » ou « Remise », clique, et se prend un refus. Effet :
perte de confiance dans l'outil, et appels au gérant en plein service. Le back-end est **sûr** —
c'est l'UI qui ment.

### 5.3 Actions

1. Choisir la doctrine : **masquer** ou **désactiver avec explication** (« Réservé au gérant »).
   *Recommandation : désactiver + info-bulle — masquer rend l'app incompréhensible entre rôles.*
2. Brancher `RoleAwareView` sur les actions **sensibles** d'abord : annulation, remise, offert,
   ouverture de tiroir, clôture Z, modification de prix.
3. Tester avec un compte **serveur** (pas admin) : parcourir POS et KDS, relever chaque action
   proposée puis refusée.

---

## 6. LOT E — Accessibilité 🟠

```bash
grep -rl "aria-" src --include="*.tsx" | wc -l                 # 36  (4 %)
grep -rl "role=" src --include="*.tsx" | wc -l                 # 16
grep -rhoE "<(div|span)[^>]*onClick" src --include="*.tsx" | wc -l  # 17
grep -rl "toHaveNoViolations\|axe" src --include="*.test.*" | wc -l # 2
```

Point positif mesuré : **0** `<img>` sans `alt`.

**Actions** : convertir les **17** `<div onClick>` en `<button>` (focus clavier + rôle gratuits) ;
nommer les boutons icône (`aria-label`) — critique sur POS/KDS où presque tout est une icône ;
gérer le focus dans `Modal` / `BottomSheet` (piège de focus + `Échap`) ; ajouter `jest-axe` sur
les 5 écrans les plus utilisés.

> Enjeu au-delà du confort : accessibilité = obligation légale croissante pour un logiciel
> vendu à des commerces recevant du public.

---

## 7. LOT F — Perte de saisie 🟠

```bash
grep -rl "onSubmit" src --include="*.tsx" | wc -l                            # 27
grep -rl "beforeunload\|isDirty\|unsavedChanges\|confirmLeave" src ...       # 1
```

**27** formulaires, **1** garde. Quitter une fiche produit, une réservation ou un bon de réception
à moitié rempli = tout est perdu, **sans avertissement**.

**Actions** : hook `useUnsavedChanges()` branché sur la navigation Next **et** `beforeunload` ;
appliquer aux formulaires longs d'abord (fiche produit, recette, réception, contrat) ;
envisager un brouillon local (`localStorage` scopé tenant) pour les saisies longues en salle.

---

## 8. LOT G — Coût client 🟠

```bash
grep -rl "use client" src --include="*.tsx" | wc -l   # 779 / 907  (86 %)
grep -rl "next/dynamic" src --include="*.tsx" | wc -l # 25
grep -rl "<img " src --include="*.tsx" | wc -l        # 17  (vs 6 next/image)
```

**86 %** de l'app est rendue côté client : le bénéfice SSR de Next est largement neutralisé.
Sur une tablette de salle en 4G, cela se paie au démarrage et après chaque rechargement.

**Actions** : mesurer **avant d'optimiser** (taille des bundles par route, LCP sur tablette) ;
retirer `'use client'` des composants purement présentationnels ; `next/dynamic` sur les gros
modules non critiques (simulateur, cartographie 3D, portail de documentation) ; migrer les
**17** `<img>` vers `next/image`.

---

## 9. LOT H — Pages d'erreur 🟡

**3** `error.tsx` pour ~75 routes. Sur les autres, une exception non capturée affiche l'écran
blanc par défaut de Next, **en plein service**.

**Actions** : un `error.tsx` par groupe de routes au minimum (`(ops)` en a déjà un, `pos` aussi) ;
message orienté reprise (« Reprendre le service », panier préservé) plutôt que trace technique ;
`Sentry.captureException` dans chaque frontière.

---

## 10. LOT I — Verrouillage anti-régression

Chaque angle mort doit devenir une **gate**, sinon il revient.

| Invariant | Vérifie | Cliquet initial (2026-08-26) |
|---|---|---|
| **INV-19** | Couverture i18n réelle (fichiers avec `t()` ÷ fichiers avec texte) | 32 fichiers |
| **INV-20** | `new Date()` interdit dans les chemins fiscaux | 1 210 global |
| **INV-21** | Toute liste `.map()` d'une page a un état vide | 2 `<EmptyState>` |
| **INV-22** | `<div onClick>` sans `role`/`tabIndex` | 17 |
| **INV-23** | Chaque groupe de routes a un `error.tsx` | 3 |

Même patron que les 5 cliquets de `preflight.sh` : le chiffre ne peut que **baisser**, jamais monter,
et `verify-gate-integrity.mjs` empêche de relever le seuil pour faire passer un commit.

---

## 11. Rectification — ce que l'audit a écarté

**Fuites d'intervalles : conclusion initiale ERRONÉE, corrigée avant publication.**

Le comptage brut donnait 47 `setInterval` pour 40 `clearInterval`, suggérant 7 fuites.
Vérification du fichier suspect `src/lib/nexus/adapters/PollingSnapshotMixin.ts` :

```
69: let stopped = false;
80: timer = setTimeout(poll, nextDelay());
109: return () => { stopped = true; if (timer !== null) clearTimeout(timer); };
```

La boucle est **correctement nettoyée** (auto-planifiée par `setTimeout` + drapeau d'arrêt) ;
les occurrences `setInterval` détectées étaient des **commentaires** documentant l'ancien bug.
**Aucune fuite confirmée.** Angle mort **écarté**.

> Consigné volontairement : un audit qui ne montre pas ce qu'il a écarté n'est pas vérifiable.

---

## 12. Séquencement recommandé

| Étape | Lot | Charge | Pourquoi ce rang |
|---|---|---|---|
| 1 | **A** — états vides / chargement | ~1 session | Cause directe du « rien ne marche » |
| 2 | **C** — fuseau, chemins fiscaux | ~1 session | Risque NF525, non rattrapable après coup |
| 3 | **D** — RBAC dans l'UI | ~0,5 session | Confiance du personnel en salle |
| 4 | **F** — perte de saisie | ~0,5 session | Perte de travail réelle, correctif simple |
| 5 | **B** — extraction i18n (surfaces client) | ~1,5 session | Gros volume, mais séquençable |
| 6 | **E** — accessibilité (17 `div onClick` + libellés) | ~1 session | Enjeu légal croissant |
| 7 | **H** — pages d'erreur | ~0,5 session | Filet de sécurité |
| 8 | **G** — coût client (mesurer d'abord) | ~1 session | Optimiser sans mesure = perte de temps |
| 9 | **I** — invariants + cliquets | ~0,5 session | Rend les 8 lots durables |

**Total estimé : 7,5 à 8 sessions.**

> ⚠️ Les charges en « sessions » sont des **ordres de grandeur non mesurés** — seule donnée
> non chiffrée de ce document.

---

## 13. Décisions produit à trancher

1. **États vides** : ton produit doit-il expliquer ce qui manque **et** proposer l'action
   (ex. « Importer une carte »), ou rester neutre ?
2. **RBAC UI** : masquer ce qui est interdit, ou l'afficher désactivé avec la raison ?
3. **Journée fiscale** : heure de bascule et fuseau de référence — **décision comptable**,
   à faire valider, pas à décider en code.
4. **i18n** : quelles langues sont réellement visées à 12 mois ? (Extraire 964 chaînes pour
   3 langues jamais vendues serait du gaspillage.)
5. **Accessibilité** : viser une conformité formelle (RGAA/WCAG AA) ou le raisonnable ?
6. **Cible de performance** : quel appareil de référence en salle (tablette, âge, réseau) ?

---

## 14. Commandes de vérification (reproductibles)

```bash
# 1. États vides
grep -rl "<EmptyState" src --include="*.tsx" | wc -l

# 2. Couverture i18n réelle
grep -rl "\bt(['\"]" src --include="*.tsx" | wc -l
grep -rhoE ">[A-ZÉÈÀÇ][a-zéèêàçûôî]+( [a-zéèêàçA-ZÉÈ']+){1,6}<" src --include="*.tsx" | wc -l

# 3. Fuseau
grep -rho "new Date()" src --include="*.ts" --include="*.tsx" | wc -l

# 4. RBAC UI
grep -rl "can(\|hasPermission\|<RoleAwareView\|minLevel" src --include="*.tsx" | wc -l

# 5. a11y
grep -rhoE "<(div|span)[^>]*onClick" src --include="*.tsx" | wc -l

# 6. Perte de saisie
grep -rl "beforeunload\|isDirty\|unsavedChanges" src --include="*.tsx" | wc -l

# 8. error.tsx
find src/app -name "error.tsx" | wc -l
```

---

## 15. Journal de l'audit (2026-08-26)

Mesures par `grep` sur `src/` (907 fichiers `.tsx`), lecture de `EmptyState.tsx`,
`PollingSnapshotMixin.ts`, `navConfig.ts`, `CLAUDE.md`.

**Aucune ligne de `src/` modifiée pendant cet audit** — document de constat uniquement.
Une conclusion initiale (fuites d'intervalles) a été **vérifiée puis écartée** — cf. §11.
