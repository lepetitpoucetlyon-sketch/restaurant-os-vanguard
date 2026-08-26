# Plan d'unification du thème — Restaurant OS

> **Objet** : supprimer définitivement le mélange dark/light observé sur les ~84 écrans.
> **Branche** : `fix/split-bill-inerte` · **Date** : 2026-08-26
> **Loi 7 (Zero-Claim)** : chaque chiffre de ce plan est mesuré en session, commande reproductible fournie.
> **Emplacement** : fichier posé à la racine car `docs/` est le périmètre actif de la session
> `impl-scripts-mesure`. À déplacer dans `docs/plans/` une fois cette session terminée.

---

## 0. Résumé exécutif

Le mélange dark/light **n'est pas** un problème de couleurs mal choisies. Trois signaux de thème
concurrents cohabitent, et l'un d'eux **annule** les deux autres :

| # | Signal | Porté par | État |
|---|--------|-----------|------|
| 1 | `data-theme` sur `<html>` | `ThemeApplicator` ← `themeModeAtom` | ✅ correct |
| 2 | `prefers-color-scheme` (OS) | variant Tailwind `dark:` | ✅ **corrigé (V1)** |
| 3 | **Style inline sur `<html>`** | `BrandingProvider` | 🔴 **écrase 1 et 2** |

**Preuve mesurée en runtime** (console navigateur, `/settings?simulacra=true`) :

```js
document.documentElement.getAttribute('data-theme')            // → "dark"
getComputedStyle(document.documentElement)
  .getPropertyValue('--surface-card')                          // → "#ffffff"  ← palette CLAIRE
document.documentElement.getAttribute('style').length          // → 1439 caractères
```

L'app est en mode sombre **et** ses tokens de surface sont clairs. Les composants qui utilisent
les tokens restent clairs ; ceux qui codent le sombre en dur (ou via `dark:`) passent au sombre.
**C'est exactement ça, le mélange.**

---

## 1. Diagnostic détaillé de la cause racine

### 1.1 Chaîne de causalité

1. `src/shared/components/ThemeApplicator.tsx` pose `data-theme="dark"|"light"` sur `<html>`
   (ou le retire en `auto`). **Correct.**
2. `src/app/globals.css` redéfinit les tokens neutres sous `:root[data-theme="dark"]`
   (lignes ~160+) et sous `@media (prefers-color-scheme: dark)`. **Correct.**
3. `src/lib/BrandingProvider.tsx:178` exécute :
   ```ts
   const cssVars = generateCSSVariables({ ...semanticTokens, ...overrides });
   Object.entries(cssVars).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
   ```
   → écriture **inline** sur `document.documentElement`.
4. `src/shared/nexus/tokens/semantic.ts:99` — `generateCSSVariables(tokens)` **n'accepte aucun
   paramètre de thème**. Elle émet systématiquement les valeurs de `semanticTokens`, qui sont la
   **palette claire**, y compris les 14 tokens neutres `--surface-*` / `--text-*` / `--border-*`.
5. **Un style inline a une priorité supérieure à toute règle de feuille de style**, sélecteur
   `:root[data-theme="dark"]` compris. Les surcharges de l'étape 2 sont donc **mortes**.

### 1.2 Aggravation : `VERTICAL_APPEARANCE`

`src/lib/BrandingProvider.tsx:146-148` force le mode selon la verticale :

```ts
const verticalAppearance = VERTICAL_APPEARANCE[variant] ?? 'dark';
if (!hasUserPref && verticalAppearance !== 'auto') setThemeMode(verticalAppearance);
```

Le défaut est **`'dark'`**. Donc pour tout tenant sans préférence enregistrée, l'app se déclare
sombre **au moment même** où elle injecte une palette claire. La contradiction est structurelle,
pas accidentelle.

### 1.3 Conséquence sur la stratégie

> **Migrer les 225 fichiers restants sans corriger 1.1 ne supprimera pas le mélange.**
> Les composants migrés liront des tokens… qui resteront bloqués sur la palette claire.
> **La cause racine est donc un prérequis, pas une option.**

---

## 2. État des lieux mesuré

### 2.1 Inventaire des écrans

```bash
find "src/app/(client)"    -name page.tsx | wc -l   # 50
find "src/app/(admin)"     -name page.tsx | wc -l   # 14
find "src/app/(marketing)" -name page.tsx | wc -l   # 11
```

| Groupe | Pages | Coque |
|---|---:|---|
| Application opérationnelle `(ops)` | 41 | sidebar + header, thème clair |
| Console admin / MCC | 14 | sombre assumé |
| Marketing public | 11 | landing, hors app |
| Public tenant `(public)` | 8 | vitrine, login |
| **Total** | **75** | (+ sous-routes `[slug]` ≈ 84) |

### 2.2 Dette « sombre en dur »

Commande de référence :

```bash
grep -rhoE '(bg-black|bg-\[#0[0-9a-fA-F]{5}\]|bg-(gray|neutral|zinc|slate)-9(00|50)|bg-surface-sidebar)' \
  src --include="*.tsx" | sort | uniq -c | sort -rn
```

| Motif | Occurrences | Verdict |
|---|---:|---|
| `bg-surface-sidebar` | 389 | 🔴 token figé sombre, hors sidebar = fuite |
| `gray/slate-900\|950` | 214 | 🔴 aveugle au thème |
| noir translucide (`bg-black/NN`) | 61 | 🟢 voiles de modale — **légitimes** |
| hex quasi-noir (`bg-[#0xxxxx]`) | 12 | 🟠 cas par cas |
| noir opaque (`bg-black` nu) | 4 | 🟠 marginal |

**227 fichiers** contiennent au moins une occurrence (hors variant `dark:`).

### 2.3 Répartition par pilier (pour le séquencement)

| Zone | Fichiers | Occurrences |
|---|---:|---:|
| `shared/components` | 47 | 116 |
| `modules/ops` | 32 | 70 |
| `modules/compliance` | 27 | 72 |
| `app/(client)` | 25 | 61 |
| `modules/commerce` | 25 | 50 |
| `modules/facility` | 20 | 59 |
| `app/(admin)` | 17 | 61 |
| `modules/logistics` | 17 | 52 |
| `modules/finance` | 15 | 47 |
| `modules/human` | 11 | 16 |
| `modules/intelligence` | 9 | 23 |
| `app/(marketing)` | 4 | 6 |

### 2.4 Zones légitimement sombres — **ne PAS migrer**

`DesktopSidebar` · `SplashScreen` · écran « Accès Exécutif » (login) · coque `kiosk`
(`LayoutResolver.tsx:96`) · KDS / cuisine · console MCC `app/(admin)` · voiles de modale.

> Migrer ces composants **casserait un design voulu**. C'est pourquoi le reste demande un tri
> manuel, jamais un rechercher-remplacer global.

---

## 3. Travaux déjà livrés (2026-08-26)

| Vague | Portée | Fichier(s) | Vérif |
|---|---|---|---|
| **V1** | `dark:` rebranché sur `data-theme` — **150 fichiers réparés en une règle** | `src/app/globals.css` (`@custom-variant dark`) | HTTP 200, 0 erreur CSS |
| **V2** | Moteur de tous les écrans Réglages migré vers les tokens | `src/shared/components/settings/ui/StandardSettingsEngine.tsx` | tsc 0 · vérifié à l'écran |
| **V3 (pilote)** | Pilier `facility` : boutons illisibles (texte gris sur quasi-noir) | `src/modules/facility/components/equipment/EquipmentHubView.tsx` | tsc 0 |
| **Bonus** | Splash `'always'` → `'first-boot'` (il rejouait à chaque navigation) | `src/shared/providers/SplashGate.tsx:45` | vérifié à l'écran |

Constat au passage : `Header.tsx`, `Toast.tsx`, `NotificationPanel.tsx` n'utilisaient **que** des
`dark:` → **déjà réparés par la V1**, aucune migration nécessaire.

---

## 4. LOT 0 — Corriger la cause racine ⚠️ PRÉREQUIS

**Objectif** : que `data-theme` pilote réellement les tokens neutres.
**Sans ce lot, les lots 1 à 4 ne suppriment pas le mélange.**

### Option A — Rendre l'injection sensible au thème

`generateCSSVariables(tokens, mode)` émet la palette du mode courant.

- **Pour** : le branding garde la main sur tout ; un seul point de vérité.
- **Contre** : il faut définir **et maintenir** une palette sombre pour chaque verticale
  (12 verticales × tokens neutres). `BrandingProvider` doit se ré-exécuter à chaque changement
  de thème (dépendance `themeMode` dans le `useEffect`).
- **Risque** : moyen. Surface de code élargie.

### Option B — Ne plus injecter les tokens neutres ✅ **recommandée**

`BrandingProvider` n'injecte plus que **l'identité de marque** ; le CSS reprend la main sur
clair/sombre.

- **Injecté (identité)** : `--action-primary`, `--action-primary-hover`, `--action-primary-fg`,
  `--action-accent`, `--action-danger`, `--radius-*`, `--glass-*`, `--font-*`, logo, favicon.
- **Retiré (neutres — 14 tokens)** : `--surface-bg`, `--surface-card`, `--surface-modal`,
  `--surface-sidebar`, `--text-primary`, `--text-secondary`, `--text-muted`,
  `--border-default`, `--border-subtle`, `--border-focus`, …
  → gérés **exclusivement** par `globals.css` (`:root`, `[data-theme="dark"]`, media query).

- **Pour** : rend au CSS son rôle ; aucune palette sombre à maintenir par verticale ; correctif
  le plus petit et le plus sûr ; supprime la contradiction structurelle.
- **Contre** : un tenant en `brandingMode: 'custom'` qui aurait personnalisé une **surface**
  perd cette personnalisation.
- **Mitigation** : audit préalable (§4.1). Si des tenants personnalisent des surfaces, ajouter
  un garde-fou : n'injecter une surface **que** si elle diverge du défaut **et** seulement en
  mode `light`.

### 4.1 Étapes d'exécution (Option B)

1. **Mesurer l'exposition** — combien de verticales personnalisent réellement une surface ?
   ```bash
   grep -rn "surface" src/shared/nexus/tokens/verticals/*.ts | grep -vE "sidebar|modalDark" | head -30
   ```
   Si le résultat est vide ou marginal → option B sans risque.
2. **Scinder la génération** dans `src/shared/nexus/tokens/semantic.ts` :
   - `generateBrandCSSVariables()` → identité seulement (injectée inline) ;
   - `generateNeutralCSSVariables()` → conservée pour les tests / le design-system, **non injectée**.
3. **Modifier** `src/lib/BrandingProvider.tsx:177-178` pour n'injecter que le premier jeu.
4. **Compléter** `BRAND_CSS_VARS_TO_CLEAN` (`BrandingProvider.tsx:120-131`) avec les 14 tokens
   neutres, afin de **purger les valeurs inline déjà posées** chez les utilisateurs existants
   (sinon un cache navigateur conserve l'ancien style inline).
5. **Arbitrer `VERTICAL_APPEARANCE`** (`src/shared/nexus/tokens/verticals/index.ts:46`) :
   le défaut `?? 'dark'` de `BrandingProvider.tsx:146` est-il voulu pour `restaurant` ?
   → Décision produit à prendre explicitement.

### 4.2 Critères d'acceptation

```js
// En mode sombre, dans la console :
document.documentElement.setAttribute('data-theme','dark');
getComputedStyle(document.documentElement).getPropertyValue('--surface-card').trim();
// ATTENDU : #1f2937   (aujourd'hui : #ffffff)
```

- [ ] Bascule light → dark : **toutes** les surfaces à tokens changent.
- [ ] La couleur de marque (`#C5A059`) reste identique dans les deux thèmes.
- [ ] Aucun style inline `--surface-*` ni `--text-*` sur `<html>`.

---

## 5. LOT 1 — `shared/components` (47 fichiers · 116 occurrences)

**Priorité maximale** : ces composants sont montés sur **tous** les écrans ; une fuite ici
contamine les 84 pages.

Cibles mesurées : `ui/Feedback.tsx` (18), `settings/hours/DayRow.tsx` (18),
`settings/PayrollIntegrationPanel.tsx` (14), `settings/payroll-integration/PayrollProviderTab.tsx` (13),
`TutorialBubble.tsx` (10), `support/SupportHelpWidget.tsx` (7),
`settings/panels/OnboardingChecklistSettingsPanel.tsx` (7).

**Table de correspondance** (à appliquer **après** lecture du contexte, jamais en aveugle) :

| Avant | Après | Note |
|---|---|---|
| `slate-900` / `gray-900` en fond | `bg-surface-card` | surface de carte |
| `slate-950` en fond | `bg-surface-glass` | fond discret |
| bordure `slate-800` | `border-border-default` | |
| `bg-surface-sidebar/30\|40\|50\|60` | `bg-surface-card` | hors sidebar réelle |
| `text-white` (sur surface à tokens) | `text-text-primary` | ⚠️ garder sur bouton or/danger |
| `hover:text-white` | `hover:text-text-primary` | invisible en clair sinon |
| noir translucide (voile modale) | **inchangé** | légitime |

---

## 6. LOT 2 — Piliers métier (par ordre de densité)

| Ordre | Pilier | Fichiers | Occ. | Remarque |
|---|---|---:|---:|---|
| 1 | `modules/ops` | 32 | 70 | ⚠️ **exclure KDS/cuisine** (sombre voulu) |
| 2 | `modules/compliance` | 27 | 72 | modales contrats = gros porteurs |
| 3 | `modules/commerce` | 25 | 50 | |
| 4 | `modules/facility` | 20 | 59 | pilote déjà fait |
| 5 | `modules/logistics` | 17 | 52 | |
| 6 | `modules/finance` | 15 | 47 | |
| 7 | `modules/human` | 11 | 16 | |
| 8 | `modules/intelligence` | 9 | 23 | ⚠️ simulateur = sombre voulu ? |

Gros porteurs identifiés :
`compliance/legal/.../MCCCreateContractModal.tsx` (14),
`compliance/legal/.../TenantContractSignModal.tsx` (11),
`logistics/.../InventoryReceptionDashboard.tsx` (10),
`intelligence/ia/simulator/.../SimulationDashboard.tsx` (8),
`facility/.../AddGuideModal.tsx` (8).

**Méthode par fichier** (obligatoire) :
1. Identifier **sur quelle page** le composant est rendu et **quel thème** y règne.
2. Si la page est sombre par design → **ne rien changer**, documenter l'exception.
3. Sinon appliquer la table §5, puis **vérifier le contraste** du texte sur la nouvelle surface.
4. `npx tsc --noEmit` après chaque pilier.

---

## 7. LOT 3 — `app/(client)` et `app/(admin)`

- `app/(client)` : 25 fichiers · 61 occ. → **à migrer** (coque claire).
- `app/(admin)` : 17 fichiers · 61 occ. → **sombre assumé (console MCC)**. Ne migrer que si une
  décision produit tranche pour un MCC clair. Sinon : **documenter comme exception**, pas comme dette.
- `app/(marketing)` : 4 fichiers · 6 occ. → hors app, priorité basse.

---

## 8. LOT 4 — Verrouillage anti-régression

`.claude/hooks/design-guard.sh` **bloque déjà** `bg-slate-[0-9]+` à l'écriture
(escape hatch : commentaire `vibe-allow` en fin de ligne). **La dette ne peut donc plus grossir.**

À ajouter :

1. **Étendre les motifs** du guard : `bg-gray-9(00|50)`, `bg-neutral-9(00|50)`,
   `bg-zinc-9(00|50)`, `bg-\[#0[0-9a-f]{5}\]`.
2. **Invariant INV-14** dans `src/__tests__/architecture/invariants.test.ts` — cliquet chiffré :
   ```ts
   // Le nombre de surfaces sombres en dur ne doit JAMAIS augmenter.
   expect(countHardcodedDarkSurfaces()).toBeLessThanOrEqual(RATCHET); // RATCHET = valeur du jour
   ```
   Baisser `RATCHET` à chaque lot livré (même patron que les 5 cliquets de `preflight.sh`).
3. **Invariant INV-15** — méta-garde : `BrandingProvider` ne doit pas injecter de token neutre.
   ```ts
   const src = readFileSync('src/lib/BrandingProvider.tsx', 'utf8');
   expect(src).not.toMatch(/setProperty\(['"]--surface-(bg|card|modal)['"]/);
   ```
4. **Test de non-régression du thème** : monter l'app avec `data-theme="dark"` et asserter que
   `--surface-card` ≠ palette claire.

---

## 9. Séquencement recommandé

| Étape | Lot | Charge | Bloquant ? |
|---|---|---|---|
| 1 | **LOT 0** — cause racine (option B) | ~1 session | 🔴 **oui, prérequis** |
| 2 | LOT 4.1 — étendre le guard | 15 min | non |
| 3 | LOT 1 — `shared/components` | ~1 session | non |
| 4 | LOT 2 — piliers 1 à 4 | ~1,5 session | non |
| 5 | LOT 2 — piliers 5 à 8 | ~1 session | non |
| 6 | LOT 3 — `app/(client)` | ~0,5 session | non |
| 7 | LOT 4.2-4.4 — invariants + cliquet | ~0,5 session | non |

**Total estimé : 5,5 à 6 sessions.**

---

## 10. Décisions produit à trancher (hors code)

1. **Option A ou B** pour le LOT 0 ? *(recommandation : B)*
2. Le défaut `VERTICAL_APPEARANCE ?? 'dark'` est-il voulu pour la verticale `restaurant` ?
3. La console MCC reste-t-elle sombre en dur (exception documentée) ou suit-elle le thème ?
4. Le KDS/cuisine reste-t-il sombre en permanence (lisibilité en cuisine) ?
5. Un tenant doit-il pouvoir personnaliser une **surface**, ou seulement son **identité** de marque ?

---

## 11. Journal des vérifications (session du 2026-08-26)

- `npx tsc --noEmit` → **exit 0** après V1, V2, V3-pilote et le changement de splash.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3455/pos?simulacra=true` → **200**.
- Rendu vérifié à l'écran : POS (plan de salle + grille produits + panier), Réglages, `/operations`.
- Cause racine constatée en runtime via `getComputedStyle` (cf. §0).

### Correctifs connexes livrés le même jour (hors thème)

| Sujet | Fichier | Nature |
|---|---|---|
| Lien « Tableau de bord » pointait vers la landing marketing | `MobileNavBar.tsx:40`, `navConfig.ts:108` | `/` → `/operations` |
| Mode local illisible : la lecture plantait sur Firestore avant de servir les données locales | `SimulacraAdapter.ts` | `get()`/`query()` tolérants à l'échec cloud |
| Données de démo non conformes aux type-guards (`seats`, `tableNumber`, totaux, prix ×10 000) | `DemoSeeder.ts` | réalignement |

### Note de coordination multi-sessions

Le hook `.claude/hooks/check-session-collision.sh` extrait les jetons ressemblant à un chemin
depuis `sessions.md`. La phrase « Ne touche PAS `src/` » de la session `impl-scripts-mesure` était
donc lue comme une **revendication** du périmètre `src/`. La formulation a été corrigée
(« N'écrit AUCUN code applicatif ») ; la session reste **active**, elle n'a pas été clôturée.
Sauvegarde de `sessions.md` dans le scratchpad de session.
