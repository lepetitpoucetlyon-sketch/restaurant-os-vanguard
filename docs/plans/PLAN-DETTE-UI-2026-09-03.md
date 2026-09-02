# 🧹 Plan — Résorption de la dette UI mesurée

> **Date** : 2026-09-03
> **Cible** : les 4 compteurs *informatifs* de `npm run measure`
> **Méthode** : lot par lot, chaque lot passe le hook pre-commit intégral, mesure avant/après.
> **Principe** : on ne vise pas 0 partout d'un coup — on descend, on documente les faux positifs, on abaisse les cliquets quand ils existent.

---

## 0. État de départ (mesuré 2026-09-03)

| Compteur | Valeur | Cliquet | Décomposition réelle |
|---|---:|---|---|
| **m4 · Risques responsive** | 108 | *aucun* (informatif) | `grid-cols-[3-9]` sans variante : **12** · `w/min-w-[Npx]` sans variante : **96** (dont ~30 `max-w-` bénins, 38 `min-w-`, 24 `w-`) · `<table>` sans overflow : **0** ✅ |
| **m7 · Erreurs avalées** | 199 | *aucun* | `catch {}` vides : **0** ✅ · `catch` à commentaire : 39 (non comptés) · **`.then()` sans `.catch()` : 199** |
| **m14 · Chaînes FR en dur** | 767 | `FR_HARDCODED_MAX=767` | 767 nœuds texte JSX accentués sur **353 fichiers** (max 6/fichier). Zones : `shared/components` 124 · `(admin)` 111 · `commerce` 97 · `ops` 79 |
| **m16 · Couleurs en dur** | 945 | `HARDCODED_HEX_MAX=955` | 945 sur **248 fichiers**. ~103 dans des **générateurs email/print/PDF** (ne peuvent PAS utiliser `var(--token)`). Reste = vraie UI. |

---

## 1. m4 — Risques responsive (→ cible ~40)

### 1.1 Ce que la mesure attrape vraiment
`valeur = gridsFiges + largeursFigees + tablesSansOverflow`. Le `text-[≤11px]`, `h-screen`, `min-h-screen` sont dans `extra`, **pas** dans la valeur.

### 1.2 Tri
| Cas | Nb | Verdict | Action |
|---|---:|---|---|
| Pavés PIN `grid-cols-3` (`SecurityPinModal`, `PinLogin`) | 2 | Fixe **par design** (clavier numérique) | `grid-cols-3` → `grid-cols-3 sm:grid-cols-3` (intention explicite) |
| Calendriers semaine `grid-cols-7` (`ReservationCalendarPopup` ×2, `WeeklyView`, `PlanningDashboard` ×2, `TeamCalendar`) | 6 | 7 jours = 7 colonnes | wrapper `overflow-x-auto` + `min-w-[42rem]` sur mobile, OU `grid-cols-7` explicite si déjà scrollable |
| Sélecteur pourboire `grid-cols-4` (`TableSplitBillModal`) | 1 | 4 petits boutons | `grid-cols-2 sm:grid-cols-4` |
| Marketing / outil interne (`HomeContent`, `PropertyInspector`) | 3 | Vraie amélioration possible | `grid-cols-1 sm:grid-cols-3` etc. |
| `max-w-[Npx]` | ~30 | **Bénin** (contrainte responsive par nature) | `px` → `rem` (`max-w-[280px]` → `max-w-[17.5rem]`) : identique + respecte le zoom + sort du regex `\d{3,4}px` |
| `min-w-[Npx]` sur cellules/colonnes de tableau | ~20 | Risque overflow réel | parent en `overflow-x-auto` (souvent déjà là) → convertir en `rem` ; sinon `min-w-0` |
| `w-[Npx]` décoratifs (halos `blur`, `pointer-events-none`, `absolute`) | ~12 | Neutre visuellement | `px` → `rem` |
| `w-[Npx]` structurants (sidebar `w-[300px]`, popovers `min-w-[160px]`) | ~12 | Intentionnel | garder, convertir en `rem` |

### 1.3 Règle d'or
- **Jamais** casser une UX fixe-par-design pour faire baisser un compteur.
- Conversion `px→rem` systématique sur les valeurs arbitraires : gain a11y réel + sort du motif.
- `min-w` de colonne → s'assurer que le parent scrolle.

---

## 2. m7 — Promesses flottantes (→ cible ~50)

### 2.1 Motif
`.then(` sur une ligne, sans `.catch(` dans les 6 lignes suivantes. Faux positifs : `.catch` à >6 lignes, ou `await promise.then(...)` (l'`await` propage déjà).

### 2.2 Action par cas
| Cas | Action |
|---|---|
| `service.call().then(x => setState(x))` sans catch | ajouter `.catch(err => logger.error('[Composant] …', err))` |
| `emit(...).then(...)` fire-and-forget | `.catch(() => {})` explicite **avec commentaire** (`// best-effort, l'échec ne bloque pas le flux`) |
| `.then()` dans un `useEffect` | envelopper : `void (async () => { try { … } catch (e) { logger.error(…) } })()` |
| déjà `await …then()` | faux positif — laisser, la mesure descendra au prochain relevé si on reformate |

### 2.3 Garde-fou
`logger` doit être importé (`@/lib/logger`). Pour les fichiers `route.ts` serveur : `logger` de `@/lib/logger` aussi. Ne **jamais** avaler silencieusement une erreur fiscale / de scellement (NF525) — celles-là remontent.

---

## 3. m14 — Chaînes FR en dur (→ lot 1 : écrans opérationnels)

### 3.1 Coût réel
353 fichiers. Chaque chaîne → `t('pilier.ecran.cle')` + entrée dans **`fr.ts` ET `en/es/pt/ja.ts`** (cliquet `i18nParity` = 0) + le cliquet `MISSING_I18N_KEYS` reste 0. C'est un chantier de plusieurs jours.

### 3.2 Découpage recommandé (par valeur d'usage)
1. **Lot 1 — Coup de feu** : `ops/service/*/pos/`, `ops/production/kds/`, tables, encaissement (~60 chaînes). Ce sont les écrans utilisés sous pression.
2. **Lot 2 — Onboarding & provisioning** : `ProvisioningWizard`, `commerce/acquisition/onboarding/` (~50).
3. **Lot 3 — Admin/MCC** : `(admin)/admin/mcc/` (~111) — moins prioritaire (usage éditeur interne).
4. **Lot 4 — Finance/compliance** : attention, **ne PAS** traduire les libellés NF525/FEC/PCG/HCR (rester en FR légal — déjà exclus par le skip `legal/rgpd/…` mais pas les libellés dans les composants comptables).
5. **Lot 5 — shared/components** : le socle (124) — impact transverse, à faire en dernier avec revue.

### 3.3 Convention de clés
`t('<pilier>.<ecran>.<slug>')` — ex. `t('ops.pos.sendToKitchen')`. Slug en anglais, court. Regrouper par écran dans `fr.ts`.

### 3.4 Anti-triche
- **Interdit** : `{'chaîne accentuée'}` pour sortir du regex sans traduire. La mesure descend, la dette reste.
- **Interdit** : baisser `FR_HARDCODED_MAX` sans que la valeur mesurée descende d'autant.

---

## 4. m16 — Couleurs en dur (→ cible ~700 + whitelist justifiée)

### 4.1 Faux positifs légitimes (à whitelister dans `m16`)
Les générateurs qui émettent du **HTML email / PDF / SVG rasterisé** ne peuvent pas utiliser `var(--token)` (clients mail sans support CSS vars, print à couleur concrète) :
- `**/*[Rr]eport*.ts` (`weeklyReport.ts` = 39)
- `**/*[Pp]rint*.ts` / `recipePrintHelper.ts` (16)
- `src/app/api/email/**` (`reservation-confirm` = 32)
- `src/app/api/signup/route.ts` (16 — email de bienvenue)

→ ~103 occurrences. Ajout au `whitelist` de `m16` **avec commentaire justificatif**. Ce n'est pas de la triche : c'est la même logique que `globals.css` / `tokens/` / marketing déjà exclus.

### 4.2 Sources de palette (à whitelister ou migrer vers tokens)
- `src/lib/constants.ts` (13), `src/config/navConfig.ts` (15), `src/kernel/open-pencil/schema/StyleTokens.ts` (13) — définissent des palettes. Soit whitelist (`/constants\.ts$/`, `StyleTokens`), soit ces couleurs deviennent des tokens.

### 4.3 Vraie UI à migrer
`SettingsDashboard.tsx` (30), `TableChairs.tsx` (18 — SVG plan de salle), `SimpleFloorPlanEditor.tsx` (16), `RecipeTechnicalSheet.tsx` (16), `AllergensTab.tsx` (14) → remplacer `#hex` / `rgba()` par classes token (`bg-surface-card`, `text-text-primary`) ou `var(--color-*)`.

### 4.4 Cliquet
`HARDCODED_HEX_MAX=955`, valeur 945. Après whitelist + migration → abaisser à la valeur réelle. **Jamais relever.**

---

## 4bis. État d'avancement (2026-09-03)

| Lot | Compteur | Avant → Après | Commit | Statut |
|---|---|---|---|---|
| **A** | m4 responsive | **108 → 0** | `db56c2e31` | ✅ fait (px→rem ×129, 12 grilles) |
| **B** | m7 erreurs avalées | **199 → 23** | `f3be6ea57` | ✅ fait (mesure durcie -157 faux positifs code-split + 19 vrais `.catch()`) |
| **C** | m16 couleurs | **945 → 803** | `8c491d13d` | ✅ mesure durcie (whitelist HTML-generators + palette-source). **Reste 803 = vraie tokenisation UI** |
| **D** | m14 chaînes FR | 767 | — | ⏳ **pas commencé** — voir constats ci-dessous |

### Constats m14 (bloquants pour un lot rapide)
- `fr.ts` a une section `"pos"` (grosse) mais **pas de section `"kds"`**.
- Les composants KDS (`KDSHeader`, `KDSDashboard`, …) **n'importent pas `useLanguage`** — zéro `t()`. i18n à câbler depuis zéro sur ce pilier.
- Périmètre coup de feu (POS/KDS) : ~40 chaînes sur ~20 fichiers, 1-3 par fichier — dispersé, beaucoup de cérémonie par chaîne.
- Chaque chaîne = `t()` + entrée dans **5 fichiers de locale** + cliquet `missingI18n` doit rester 0.

### Recommandation m14
Session dédiée. Décider d'abord la **taxonomie de clés** (`ops.pos.*`, `ops.kds.*`, `finance.accounting.*`…) puis attaquer pilier par pilier. Ne pas faire en fin de session — le risque de casser `missingI18n` (cliquet dur) ou d'introduire des clés mal nommées est réel.

---

## 5. Ordre d'exécution & critères de sortie

| Lot | Compteur | Effort | Sortie |
|---|---|---|---|
| A | m4 | ~2 h | valeur < 50, tsc 0, next build OK |
| B | m7 | ~3 h | valeur < 60, aucune erreur fiscale avalée |
| C | m16 (whitelist + UI) | ~2 h | valeur < 750, cliquet abaissé, `verify-gate-integrity` re-scellé |
| D | m14 lot 1 (coup de feu) | ~3 h | valeur < 720, `i18nParity` 0, `MISSING_I18N_KEYS` 0, cliquet abaissé |
| E→I | m14 lots 2-5 | plusieurs jours | par lot, cliquet abaissé à chaque fois |

**Chaque lot** : `npm run measure` avant/après consigné dans le message de commit · hook pre-commit intégral vert · pas de régression `gate-last-mile`.
