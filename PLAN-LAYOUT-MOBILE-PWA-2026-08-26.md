# Plan Layout · Grid · Mobile-first · PWA — Restaurant OS

> **Objet** : corriger les défauts de mise en page, de grilles, d'ergonomie mobile et de PWA.
> **Branche** : `fix/split-bill-inerte` · **Date** : 2026-08-26
> **Loi 7 (Zero-Claim)** : chaque chiffre est mesuré en session, commande reproductible fournie.
> **Emplacement** : racine du dépôt car `docs/` est le périmètre actif de `impl-scripts-mesure`.
> À déplacer dans `docs/plans/` ensuite.
> **Complémentaire** de `PLAN-UNIFICATION-THEME-2026-08-26.md` (thème) — périmètres disjoints.

---

## 0. Résumé exécutif — ce qui va bien, ce qui ne va pas

L'audit contredit l'intuition « tout est cassé ». **Les fondations sont saines** ; les défauts
sont peu nombreux mais **concentrés sur des points à fort impact**.

| Axe | Verdict | Détail |
|---|---|---|
| Stratégie responsive | 🟢 **saine** | 939 utilitaires progressifs · **0** `max-*` → vrai mobile-first |
| Breakpoints | 🟢 **pensés métier** | 5 paliers documentés (PDA → drive-thru) |
| Grilles | 🟢 **meilleures que prévu** | 455 responsives ; **7 fichiers** réellement à risque |
| PWA — socle | 🟢 **complet** | manifest + 5 icônes + raccourcis + SW + next-pwa + offline |
| **PWA — installation** | 🔴 **cassée** | `InstallPrompt` **jamais monté** : personne ne peut installer |
| **Encoche (safe-area)** | 🔴 **partielle** | `BottomSheet` / `ActionBar` / `Modal` ne la gèrent **pas** |
| **Zones tactiles** | 🟠 **sous le seuil** | **204** cibles à 32 px (< 44 px WCAG/Apple) · 0 utilitaire dédié |
| Largeurs figées | 🟠 **à surveiller** | 44 largeurs ≥ 400 px vs 70 garde-fous `overflow-x-auto` |

**Les 3 vrais problèmes** : l'app **ne peut pas être installée**, elle **passe sous la barre
d'accueil iPhone**, et **204 boutons sont trop petits pour le doigt** — le tout sur un produit
dont la promesse est le service en salle, sur tablette et mobile.

---

## 1. Ce qui est déjà sain — à ne PAS « corriger »

### 1.1 La stratégie est réellement mobile-first

```bash
grep -rhoE "max-(sm|md|lg|xl):" src --include="*.tsx" | wc -l          # 0
grep -rhoE "\b(sm|md|lg|xl):(grid-cols|flex|block|w-|p-|text-)" src --include="*.tsx" | wc -l  # 939
```

**Zéro** utilitaire `max-*` : aucun raisonnement desktop-first résiduel. Les 939 utilitaires
sont **progressifs** (la base est mobile, les paliers ajoutent). C'est la bonne architecture —
il n'y a **pas** de refonte mobile-first à faire, seulement des correctifs ciblés.

### 1.2 Les breakpoints sont documentés et métier

`src/app/globals.css:129-133`

| Palier | px | Usage déclaré |
|---|---:|---|
| `sm` | 640 | mobile portrait, PDA |
| `md` | 768 | mobile paysage / tablette |
| `lg` | 1024 | iPad landscape, tablette KDS chef |
| `xl` | 1440 | poste caisse fixe, écran mural KDS |
| `2xl` | 1600 | kiosk grand format, drive-thru |

> ⚠️ **Conséquence à connaître** : la sidebar desktop n'apparaît qu'à partir de `lg` (1024 px)
> (`LayoutResolver.tsx:115`). En dessous, c'est la coque mobile de la **même** app — ce n'est
> pas une autre version de l'interface.

### 1.3 Le viewport est déjà correct

`src/app/layout.tsx:41-50` — `width: device-width`, `initialScale: 1`, **`viewportFit: "cover"`**
(indispensable pour l'encoche), et le zoom reste autorisé (WCAG 1.4.4, protégé par un commentaire
explicite). **Ne pas régresser.**

### 1.4 Le socle PWA est complet

`src/app/manifest.ts` : `display: standalone`, `scope: /`, `start_url: /`, thème dynamique,
**5 icônes** (192/512 + maskable + badge) toutes présentes dans `public/icons/`, et des
**raccourcis applicatifs** (POS, KDS, Plan de salle, Comptabilité).
`next.config.ts:15-32` : `@ducanh2912/next-pwa` avec `runtimeCaching` (désactivé en dev — normal).
`ServiceWorkerRegistration` **est monté** dans `app/layout.tsx`.
`ConnectivityBanner` **est monté** dans `LayoutResolver`.

---

## 2. LOT A — PWA : rendre l'application installable 🔴

### 2.1 Constat

```bash
grep -rl "<InstallPrompt" src --include="*.tsx" | wc -l   # 0
```

Le composant `InstallPrompt` existe mais **n'est rendu nulle part**. Conséquences :

- L'événement `beforeinstallprompt` n'est jamais capté → **aucune invitation à installer**.
- Sur iOS, aucune consigne « Partager → Sur l'écran d'accueil » n'est affichée.
- Tout le socle PWA (manifest, icônes, raccourcis, SW, offline) est **payé mais non récolté** :
  sans installation, pas de mode standalone, donc pas de plein écran ni de raccourcis.

C'est le **meilleur rapport valeur / effort** de tout ce plan.

### 2.2 Actions

1. **Monter `InstallPrompt`** dans la coque applicative — `LayoutResolver` (à côté de
   `ConnectivityBanner`), pour qu'il soit présent sur les 4 modes de coque.
2. **Ne pas l'afficher** si `window.matchMedia('(display-mode: standalone)').matches`
   (déjà installé) — vérifier que le composant le fait, sinon l'ajouter.
3. **Chemin iOS** : Safari n'émet pas `beforeinstallprompt`. Prévoir une consigne dédiée
   (détection `standalone` + iOS), sinon la moitié du parc terrain n'a aucun moyen d'installer.
4. **Ne pas harceler** : mémoriser le refus (localStorage scopé tenant) et ne re-proposer
   qu'après un délai.

### 2.3 Critères d'acceptation

- [ ] Chrome/Android desktop : l'invite apparaît, l'installation aboutit.
- [ ] iOS Safari : la consigne « Sur l'écran d'accueil » s'affiche.
- [ ] Une fois installée, l'invite **ne réapparaît plus**.
- [ ] Les 4 raccourcis du manifest ouvrent bien POS / KDS / Plan de salle / Comptabilité.

---

## 3. LOT B — Encoche & barre d'accueil (safe-area) 🔴

### 3.1 Constat

```bash
grep -rhoE "safe-area-inset|env\(safe" src --include="*.tsx" --include="*.css" | wc -l   # 6
```

**6 occurrences seulement**, concentrées dans `globals.css`, `MobileNavBar`, `MobileHeader`.

Le bon patron existe déjà — `MobileNavBar.tsx:132` :
```
pb-[calc(2rem+env(safe-area-inset-bottom))]
```

Mais **trois composants ancrés en bas ne l'appliquent pas** :

| Composant | Ancrage | Ligne | Risque |
|---|---|---|---|
| `ui/BottomSheet.tsx` | `fixed inset-0 … items-end` | 70, 94 | contenu **sous la barre d'accueil** |
| `ui/ActionBar.tsx` | `fixed bottom-6` / `sticky bottom-0` | 29, 31 | **boutons d'action** inatteignables |
| `ui/Modal.tsx` | plein écran mobile | — | actions basses masquées |

En **PWA standalone** sur iPhone (le mode visé par `display: standalone`), la barre d'accueil
recouvre les ~34 px inférieurs. `ActionBar` porte des **boutons de validation** : c'est un
défaut fonctionnel, pas cosmétique.

### 3.2 Actions

1. **Créer un utilitaire partagé** dans `globals.css` plutôt que répéter le `calc()` :
   ```css
   @utility pb-safe { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
   @utility pt-safe { padding-top:    calc(1rem + env(safe-area-inset-top)); }
   ```
2. L'appliquer à `BottomSheet`, `ActionBar` (variantes `floating` **et** `sticky-bottom`), et au
   pied des `Modal` plein écran.
3. Vérifier aussi `left/right` en **paysage** (`safe-area-inset-left/right`) — cas réel du POS
   sur tablette en paysage avec encoche.

### 3.3 Critères d'acceptation

- [ ] iPhone (ou simulateur) en mode installé : aucun bouton sous la barre d'accueil.
- [ ] Paysage : aucun contenu sous l'encoche latérale.
- [ ] Aucune régression d'espacement sur les appareils **sans** encoche (`env()` = 0).

---

## 4. LOT C — Zones tactiles 🟠

### 4.1 Constat

```bash
grep -rhoE "\bw-8 h-8\b|\bh-8 w-8\b" src --include="*.tsx" | wc -l        # 204
grep -rhoE "min-h-\[4[4-9]px\]|min-h-11|min-h-12|touch-target" src ...    # 0
```

**204** contrôles à **32 px**, contre un minimum de **44 px** (Apple HIG / WCAG 2.5.5) — et
**aucun** utilitaire de zone tactile dans tout le code.

Concentration mesurée :

| Fichier | Occ. | Contexte |
|---|---:|---|
| `ops/production/kitchen/.../RecipesTab.tsx` | 5 | tablette cuisine |
| `compliance/.../TracabiliteEtiquettes.tsx` | 4 | terrain HACCP |
| `commerce/.../ReservationsHeader.tsx` | 4 | service en salle |
| `shared/nexus/guards/HermesDashboard.tsx` | 3 | — |
| `shared/components/settings/hours/DayRow.tsx` | 3 | réglages |
| `ops/service/kiosk/KioskPage.tsx` | 3 | ⚠️ **kiosk = 100 % tactile** |

### 4.2 Nuance importante

Un `w-8 h-8` **n'est pas toujours** un défaut : si l'icône de 32 px est **enveloppée** dans un
bouton parent d'au moins 44 px, la cible réelle est conforme. **Chaque cas doit être lu**, pas
remplacé en masse.

### 4.3 Actions

1. Ajouter un utilitaire `@utility touch-target { min-width: 44px; min-height: 44px; }`.
2. **Trier par surface d'usage**, dans cet ordre : `kiosk` → POS / POS-mobile → KDS/cuisine →
   HACCP terrain → réservations → réglages (souris, moins critique).
3. Pour chaque cas : vérifier le parent ; si la cible réelle < 44 px, appliquer `touch-target`
   (l'icône garde sa taille visuelle, seule la zone cliquable grandit).
4. Poser un cliquet (§6) pour empêcher l'ajout de nouvelles cibles trop petites.

---

## 5. LOT D — Grilles & largeurs figées 🟠

### 5.1 Grilles — le chiffre brut est trompeur

```bash
grep -rhoE "grid-cols-[0-9]+" src --include="*.tsx" | wc -l               # 964 total
grep -rhoE "(sm|md|lg|xl|2xl):grid-cols-[0-9]+" src --include="*.tsx" | wc -l  # 455 responsives
```

Les grilles **denses sans aucun palier** ne sont que **7 fichiers** :

| Fichier | Nature | Verdict |
|---|---|---|
| `reservations/WeeklyView.tsx` | `grid-cols-7` | 🟢 **légitime** — 7 jours |
| `reservations/ReservationCalendarPopup.tsx` | `grid-cols-7` | 🟢 légitime |
| `human/.../leaves/TeamCalendar.tsx` | `grid-cols-7` | 🟢 légitime |
| `app/(admin)/.../ComplianceTab.tsx` | MCC | 🟠 console desktop |
| `app/(admin)/.../PatchCenterTab.tsx` | MCC | 🟠 console desktop |
| `app/(admin)/.../StrategyOracle.tsx` | MCC | 🟠 console desktop |
| `kitchen/recipe-editor/RecipeCompositionTab.tsx` | éditeur | 🔴 **à traiter** — tablette cuisine |

> **Conclusion** : il n'y a **pas** de chantier grilles. Un seul fichier mérite un correctif
> (`RecipeCompositionTab`), les calendriers 7 colonnes sont corrects par nature, et la console
> MCC est un outil de bureau assumé. **Ne pas lancer de migration de masse ici.**

Piste d'amélioration à faible priorité : seulement **5** usages de `minmax()` dans tout le code.
Le patron `repeat(auto-fit, minmax(Xpx, 1fr))` supprimerait des paliers manuels sur les grilles
de cartes (produits, équipements) et fluidifierait l'adaptation.

### 5.2 Largeurs figées

```bash
grep -rhoE "w-\[[4-9][0-9]{2}px\]|w-\[1[0-9]{3}px\]" src --include="*.tsx" | wc -l  # 44
grep -rhoE "min-w-\[[3-9][0-9]{2}px\]" src --include="*.tsx" | wc -l               # 7
grep -rhoE "overflow-x-auto" src --include="*.tsx" | wc -l                          # 70
```

44 largeurs ≥ 400 px et 7 `min-w` ≥ 300 px, pour 70 garde-fous `overflow-x-auto`.
**Action** : vérifier que chaque largeur figée est soit dans un conteneur scrollable, soit
derrière un palier `lg:`. Sinon, débordement horizontal sur téléphone (375 px).

---

## 6. LOT E — Verrouillage anti-régression

À ajouter dans `.claude/hooks/design-guard.sh` et les invariants :

1. **INV-16 — cliquet zones tactiles**
   ```ts
   expect(countSmallTouchTargets()).toBeLessThanOrEqual(RATCHET); // 204 au 2026-08-26
   ```
   Baisser `RATCHET` à chaque lot livré (même patron que les 5 cliquets de `preflight.sh`).
2. **INV-17 — méta-garde PWA** : `InstallPrompt` et `ServiceWorkerRegistration` doivent rester
   montés (le premier a passé des mois orphelin sans que rien ne le détecte).
   ```ts
   expect(readFileSync('src/shared/components/layout/LayoutResolver.tsx','utf8'))
     .toMatch(/<InstallPrompt/);
   ```
3. **INV-18 — safe-area** : tout composant ancré en bas (`fixed bottom-`/`sticky bottom-0`)
   doit référencer `safe-area-inset-bottom`.
4. **Garde viewport** : interdire la réapparition de `maximumScale: 1` / `userScalable: false`
   (régression WCAG déjà survenue une fois — cf. commentaire `layout.tsx:44`).

---

## 7. Séquencement recommandé

| Étape | Lot | Charge | Impact | Bloquant ? |
|---|---|---|---|---|
| 1 | **LOT A** — monter `InstallPrompt` (+ chemin iOS) | ~0,5 session | 🔴 très fort | non |
| 2 | **LOT B** — safe-area (`pb-safe` + 3 composants) | ~0,5 session | 🔴 fort | non |
| 3 | LOT C — zones tactiles : kiosk + POS + KDS | ~1 session | 🟠 fort terrain | non |
| 4 | LOT D.2 — largeurs figées non protégées | ~0,5 session | 🟠 moyen | non |
| 5 | LOT C — zones tactiles : reste | ~1 session | 🟠 moyen | non |
| 6 | LOT D.1 — `RecipeCompositionTab` + `minmax()` | ~0,5 session | 🟢 faible | non |
| 7 | LOT E — invariants + cliquets | ~0,5 session | 🟢 durable | non |

**Total estimé : 4 à 4,5 sessions.**
Les étapes 1 et 2 (**1 session**) traitent à elles seules les deux défauts **fonctionnels**.

> ⚠️ **Estimations en « sessions » = ordres de grandeur, non mesurés** — seule donnée non
> mesurée de ce document.

---

## 8. Décisions produit à trancher

1. **Cible d'installation PWA** : le personnel installe-t-il l'app (mode standalone visé),
   ou reste-t-on en navigateur ? *Toute la valeur du LOT A en dépend.*
2. **Parc iOS** : faut-il le chemin d'installation manuel iOS (Safari n'a pas
   `beforeinstallprompt`) ?
3. **Console MCC** : outil de bureau assumé (grilles denses OK) ou doit-elle être utilisable
   sur tablette ?
4. **Kiosk** : quelle taille de cible minimale pour un écran client en libre-service ? 44 px
   est un plancher ; 56-60 px est courant en libre-service.
5. **Support téléphone** : le POS doit-il être pleinement utilisable à 375 px, ou la tablette
   (768 px+) est-elle le plancher terrain ? *Détermine l'effort sur le LOT D.*

---

## 9. Commandes de vérification (reproductibles)

```bash
# Stratégie mobile-first (doit rester 0)
grep -rhoE "max-(sm|md|lg|xl):" src --include="*.tsx" | wc -l

# Zones tactiles sous le seuil (cliquet INV-16)
grep -rhoE "\bw-8 h-8\b|\bh-8 w-8\b" src --include="*.tsx" | wc -l

# Couverture safe-area (doit augmenter)
grep -rhoE "safe-area-inset|env\(safe" src --include="*.tsx" --include="*.css" | wc -l

# PWA : InstallPrompt monté (doit être ≥ 1)
grep -rl "<InstallPrompt" src --include="*.tsx" | wc -l

# Grilles denses sans palier
grep -rlE "(^|[\"' ])grid-cols-([4-9]|1[0-2])\b" src --include="*.tsx" | while read f; do
  grep -qE "(sm|md|lg|xl|2xl):grid-cols-" "$f" || echo "$f"; done
```

---

## 10. Journal de l'audit (2026-08-26)

Mesures relevées par `grep` sur `src/`, lecture de `next.config.ts`, `manifest.ts`,
`layout.tsx`, `LayoutResolver.tsx`, `MobileNavBar.tsx`, `BottomSheet.tsx`, `ActionBar.tsx`,
et inspection de `public/icons/`.

**Aucune ligne de `src/` n'a été modifiée pendant cet audit** — document de constat uniquement.
Les correctifs livrés le même jour (thème, navigation, mode local) sont consignés dans
`PLAN-UNIFICATION-THEME-2026-08-26.md` §3 et §11.
