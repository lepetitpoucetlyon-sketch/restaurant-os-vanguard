# UIUX.md — Plan de remédiation UI/UX

> **Origine** : audit de maturité des 16 compétences UI/UX du 2026-08-27
> (artifact `498bde76`). Moyenne mesurée **2,1 / 5**.
> **Objet de ce fichier** : la suite d'actions qui fait passer chaque axe à sa cible,
> avec pour chacune les fichiers exacts, le critère d'acceptation et la commande de vérification.
>
> ⚠️ **Loi 7 (Zero-Claim)** — tous les chiffres de ce plan ont été mesurés en session le
> 2026-08-27 sur `main`. Ils constituent la **baseline gelée** de ce plan. Avant de cocher
> quoi que ce soit, re-mesurer : `npm run measure`. Ne jamais recopier un chiffre d'ici
> dans un rapport sans l'avoir re-mesuré.

---

## 0. Comment lire ce plan

### 0.1 Les cinq règles du plan

1. **Un cliquet avant une migration.** On ne migre jamais 400 fichiers d'un coup. On
   installe d'abord la mesure et le cliquet : la dette cesse de croître le jour 1,
   la migration peut ensuite prendre des mois sans risque de régression.
2. **Ne jamais relever un seuil.** `verify-gate-integrity.mjs` le refuse (Loi 2).
   Un seuil ne bouge que vers le bas, après correction réelle du code.
3. **Bout-en-bout (Loi 8).** Une correction n'est finie que si elle est *rendue*,
   *réglée*, *libellée* et *branchée*. Un composant corrigé mais non monté ne compte pas.
4. **Pas de stub déguisé.** Interdiction formelle de livrer un `catch {}` silencieux,
   un `return null` de complaisance ou un fichier qui prétend auditer sans auditer.
   Le cas `a11y/axe-config.ts` (§ A.2) est l'exemple type à ne pas reproduire.
5. **Mesurer, ne pas explorer.** Toute affirmation chiffrée passe par
   `scripts/measure/measures.mjs`. Un `grep` naïf rate les pièges déjà encodés.

### 0.2 Convention de statut

| Marque | Sens |
|---|---|
| `[ ]` | à faire |
| `[~]` | en cours |
| `[x]` | fait **et** vérifié par la commande indiquée |
| `[!]` | bloqué — la raison est écrite sur la ligne |

### 0.3 Les lots

| Lot | Objet | Axes visés | Effort | Dépend de |
|---|---|---|---|---|
| **LOT 0** | Instrumentation — rendre la dette visible | tous | 2–3 j | — |
| **LOT A** | Accessibilité | Accessibilité 1→3 | 6–9 j | LOT 0 |
| **LOT B** | Typographie | Typographie 2→4 | 2–3 j | LOT 0 |
| **LOT C** | Couleur & contraste | Couleur 3→4 | 4–6 j | LOT 0, B |
| **LOT D** | Composants & design system | Composants 2→4 | 10–15 j | LOT 0 |
| **LOT E** | Mise en page & grilles | Layout 3→4, Grilles 3→4 | 4–6 j | LOT D |
| **LOT F** | La boucle utilisateur manquante | Personas, Entretiens, Tests, Parcours | 6–8 j | — |
| **LOT G** | Outils de design & prototypage | Outils 1→3, Wireframes, Hi-Fi | 4–6 j | LOT D |

**Chemin critique** : LOT 0 → LOT A → LOT D. Le LOT F est **parallélisable dès maintenant**
et ne dépend d'aucun autre : il ne touche pas au code.

---

## 1. Baseline gelée — 2026-08-27

État de départ. Chaque ligne est un compteur que les lots doivent faire descendre (ou monter).

### 1.1 Adoption du design system

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Fichiers important le design system (`@ui/*`, `@/shared/components/ui`, `@components/ui`) | 189 / 859 — **22 %** | ≥ 60 % | D |
| Écrans fabriquant de l'UI **sans** importer le système (mesure M11) | **482** | ≤ 200 | D |
| `<button>` bruts | **1 183** | ≤ 300 | D.3 |
| `<Button/>` (primitive) | 158 | ≥ 900 | D.3 |
| `<input>` bruts | **446** (212 fichiers) | ≤ 120 | D.2 |
| Champs encapsulés (`PremiumSelect`, `GlassInput`, …) | 34 (motif M11) — 43 (comptage large) | ≥ 350 | D.2 |
| « Cartes » refaites à la main (`rounded-* + bg-*`) | **411** | ≤ 100 | D.1 |
| Variantes de carte concurrentes | 5 | 2 | D.1 |
| Modales sans la primitive `Modal` | **33 / 56** | 0 | A.6, A.7 |
| Pages sans `<PageShell>` | **66 / 84** | ≤ 20 (exclusions justifiées) | E.1 |

### 1.2 Accessibilité

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Fichiers `.tsx` portant ≥ 1 `aria-*` | 46 / 918 — **5 %** | ≥ 35 % | A |
| `<button>` sans nom accessible | **203** (motif M12) — 198 en comptage large | 0 | A.5 |
| Contrôles inaccessibles, total (mesure M12) | **276** | 0 | A |
| `<div onClick>` sans `onKeyDown` | **38** (31 fichiers) | 0 | A.4 |
| Fichiers utilisant `focus-visible` | **1** | style global + exceptions | A.3 |
| `role="dialog"` / `aria-modal` | 3 / 5 | = nombre de modales | A.6, A.7 |
| Règles ESLint a11y actives | **0** (`jsx-a11y/alt-text` à `"off"`) | jeu `recommended` | A.1 |
| Textes sous le seuil WCAG AA (écran de connexion, mesuré au rendu) | **3 / 6** | 0 | C.1 |

### 1.3 Typographie & couleur

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Tailles arbitraires `text-[…]` | **189** occ. / 21 valeurs | ≤ 20 | B.2 |
| Textes arbitraires < 12 px | **32** | 0 hors aperçus d'impression | B.4 |
| Graisses concurrentes `bold` / `black` | 1 684 / 1 603 | convention tranchée | B.3 |
| Police `font-brand` au rendu | **Georgia** (repli — `Playfair Display: error`) | police de marque chargée | B.1 |
| Usages palette Tailwind brute | **2 785** occ. / 148 combos | ≤ 400 | C.2 |
| Hex codés en dur dans le TSX | **369** occ. / 120 valeurs | ≤ 40 | C.3 |

### 1.4 Mise en page & responsive

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Largeurs px figées sans variante | **88** | ≤ 20 | E.2 |
| `<table>` sans conteneur `overflow-x` | **12** (11 localisées) | 0 | E.2 |
| `h-screen` strict | **9** | 0 | E.2 |
| Grilles à colonnes figées | **8** | 0 | E.3 |
| Fichiers avec ≥ 1 variante responsive | 397 / 918 — **43 %** | ≥ 65 % | E |
| Variantes `xl` / `2xl` | 56 / 12 | ≥ 200 / ≥ 60 | E.3 |

### 1.5 UX

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Fiches persona (objectif, contexte, douleur) | **0** | 4 | F.1 |
| Cartes de parcours lisibles hors code | **0** | 6 | F.2 |
| Séances de test d'utilisabilité | **0** | 5 / trimestre | F.3 |
| Événements d'usage collectés dans le produit | **0** | 12 événements clés | F.4 |
| Routes couvertes par la sonde runtime | **5 / 84** | ≥ 15 | 0.4 |
| Parité i18n (es / pt / ja) | **28 %** | ≥ 80 % | G.4 |

### 1.6 Divers

| Indicateur | Baseline | Cible | Lot |
|---|---:|---:|---|
| Composants sans consommateur | **78** | ≤ 20 | D.4 |
| Composants marqués `@wip` | **0** | = exploration assumée | D.4 |
| Noms de composants en collision | **27** | ≤ 5 | D.1 |
| Dossiers `components/` hors `shared/` | **106** | inventorié, pas réduit de force | D |

---

## LOT 0 — Instrumentation

> **Pourquoi en premier.** Aucune migration ne survit sans cliquet : on corrige 50 fichiers,
> trois sessions parallèles en réintroduisent 60. Ce lot ne corrige rien — il **fige la dette**.
> C'est exactement la méthode qui a déjà produit les onze mesures existantes.

### 0.1 — `[ ]` Douzième mesure : adoption du design system

**Fichier** : `scripts/measure/measures.mjs`
**Contrat à respecter** : `{ id, titre, run(corpus) → { valeur, detail: string[], extra? } }`
La mesure doit être **pure** — elle lit, elle ne décide pas. C'est `gate-last-mile.mjs` qui décide.

```js
// ─────────────────────────────────────────────────────────────────────────────
// M11 — Adoption du design system
// ─────────────────────────────────────────────────────────────────────────────
// PIÈGE : le dépôt expose QUATRE chemins vers la même bibliothèque —
// `@ui/…`, `@/shared/components/ui…`, `@components/ui…` et les imports relatifs
// internes. Une première version ne comptait que `@/shared/components/ui` et
// annonçait 6 % d'adoption au lieu de 22 % : sous-évaluation de 73 %.
// PIÈGE 2 : ne pas compter la bibliothèque elle-même parmi ses consommateurs.
export const m11_dsAdoption = {
  id: 'dsAdoption',
  titre: 'Écrans hors du design system',
  run(c) {
    const IMPORT_DS = /from\s+['"](@ui\/|@ui['"]|@\/shared\/components\/ui|@components\/ui)/;
    const detail = [];
    let boutonsBruts = 0, boutonsPrimitive = 0;
    let champsBruts = 0, champsPrimitive = 0, cartesMain = 0;

    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;
      if (f.includes('/shared/components/ui/')) continue;   // la bibliothèque n'est pas son client
      if (c.estBarrel(f)) continue;

      boutonsBruts     += (src.match(/<button\b/g) || []).length;
      boutonsPrimitive += (src.match(/<Button\b/g) || []).length;
      champsBruts      += (src.match(/<input\b/g) || []).length;
      champsPrimitive  += (src.match(/<(?:Glass|Search|Premium)?(?:Input|Select|TimePicker)\b/g) || []).length;
      cartesMain       += (src.match(/className="[^"]*\brounded-(?:xl|2xl|lg)\b[^"]*\bbg-(?:white|surface)/g) || []).length;

      // Un écran "hors système" : il fabrique de l'interface sans jamais importer le système.
      const fabrique = /<button\b|<input\b|rounded-(?:xl|2xl)/.test(src);
      if (fabrique && !IMPORT_DS.test(src)) detail.push(c.rel(f));
    }

    return {
      valeur: detail.length,
      detail: detail.sort(),
      extra: { boutonsBruts, boutonsPrimitive, champsBruts, champsPrimitive, cartesMain },
    };
  },
};
```

Puis l'ajouter au tableau exporté en fin de fichier :

```js
export const MESURES = [
  m1_reachability, m2_settings, m3_i18n, m3b_i18nParite, m4_responsive,
  m5_inertProps, m6_duplicates, m7_swallowed, m8_seal, m9_fakeMetrics, m10_footprint,
  m11_dsAdoption,          // ← ajout
];
```

> **Résultat du premier passage — code exécuté sur le corpus réel le 2026-08-27** :
> `valeur = 482` écrans fabriquant de l'interface sans jamais importer le système, avec
> `extra = { boutonsBruts: 1183, boutonsPrimitive: 158, champsBruts: 446,
> champsPrimitive: 34, cartesMain: 411 }`. **482 est donc le cliquet initial**, pas un
> chiffre décidé à l'avance.

- **Critère d'acceptation** : `npm run measure` affiche la douzième ligne et
  `.measures/latest.json` contient `mesures.dsAdoption`.
- **Vérification** : `npm run measure && python3 -c "import json;print(json.load(open('.measures/latest.json'))['mesures']['dsAdoption'])"`
- **Effort** : 3 h

### 0.2 — `[ ]` Treizième mesure : accessibilité statique

**Fichier** : `scripts/measure/measures.mjs`

Compte trois choses qu'aucun lint ne voit aujourd'hui : boutons muets, poignées de clic
non focalisables, modales sans sémantique.

```js
// ─────────────────────────────────────────────────────────────────────────────
// M12 — Contrôles inaccessibles
// ─────────────────────────────────────────────────────────────────────────────
// PIÈGE : un bouton dont le libellé vient de `{t('…')}` ou d'une variable N'EST PAS
// muet. Une version naïve qui ne cherche que du texte littéral surcompte de ~40 %.
// PIÈGE 2 : `<div onClick>` peut porter son attribut plusieurs lignes plus bas —
// il faut un motif multi-lignes, sinon on trouve 12 occurrences au lieu de 38.
export const m12_a11yControls = {
  id: 'a11yControls',
  titre: 'Contrôles inaccessibles',
  run(c) {
    const muets = [], clavier = [], modales = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;

      for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
        const [, attrs, inner] = m;
        if (/aria-label|aria-labelledby|title=/.test(attrs)) continue;
        if (/\{t\(|\{\s*label|children/.test(inner)) continue;
        const texte = inner.replace(/<[^>]+>/g, '').replace(/\{[^{}]*\}/g, '').trim();
        if (!texte) muets.push(`${c.rel(f)} — bouton sans nom accessible`);
      }

      for (const _ of src.matchAll(/<div\b[^>]*?\bonClick(?:Capture)?=/gs)) {
        clavier.push(`${c.rel(f)} — <div onClick> non focalisable`);
      }

      if (/fixed inset-0/.test(src) && /Modal|Dialog|Drawer|Sheet/.test(basename(f))) {
        if (!/role="dialog"|role="alertdialog"/.test(src)) {
          modales.push(`${c.rel(f)} — overlay sans role dialog`);
        }
      }
    }
    const detail = [...muets, ...clavier, ...modales];
    return {
      valeur: detail.length,
      detail,
      extra: { muets: muets.length, clavier: clavier.length, modales: modales.length },
    };
  },
};
```

> `basename` est déjà importé en tête de `measures.mjs` (`import { basename } from 'node:path'`).

> **Résultat du premier passage — code exécuté sur le corpus réel le 2026-08-27** :
> `valeur = 276`, avec `extra = { muets: 203, clavier: 38, modales: 35 }`.
> **276 est donc le cliquet initial.**
> L'écart avec le comptage d'audit (198 boutons muets, 33 modales) vient du motif :
> M12 est volontairement un peu plus large sur les modales (il retient tout fichier
> `*Modal|Dialog|Drawer|Sheet` avec un `fixed inset-0` sans `role`, y compris ceux qui
> utilisent par ailleurs la primitive). Un motif de mesure fait foi une fois figé —
> ne pas le « corriger » après coup pour faire baisser le chiffre.

- **Critère** : `npm run measure` affiche la treizième ligne ; `.measures/latest.json`
  contient `mesures.a11yControls` avec les trois sous-compteurs.
- **Effort** : 3 h

### 0.3 — `[ ]` Brancher les deux cliquets

Quatre fichiers à modifier **dans cet ordre**, sinon la gate d'intégrité proteste :

1. **`scripts/preflight.sh`** — à côté des seuils existants (ligne ~85) :
   ```bash
   DS_OUTSIDE_MAX=482           # écrans fabriquant de l'UI hors design system
   A11Y_CONTROLS_MAX=276        # boutons muets + div cliquables + modales sans role
   ```
   > Ces deux valeurs **ont été mesurées**, pas estimées : le code de 0.1 et 0.2 a été
   > exécuté sur le corpus réel le 2026-08-27. Re-mesurer avant de les figer, car le
   > dépôt bouge — mais ne jamais partir d'un chiffre décidé à l'avance.

2. **`scripts/gate-last-mile.mjs`** — dans l'objet `CLIQUETS` :
   ```js
   dsAdoption:       seuil('DS_OUTSIDE_MAX', 482),
   a11yControls:     seuil('A11Y_CONTROLS_MAX', 276),
   ```

3. **`scripts/verify-gate-integrity.mjs`** — dans l'objet `ratchets` de `fingerprint()` :
   ```js
   dsAdoption:   num(/DS_OUTSIDE_MAX\s*=\s*(\d+)/),
   a11yControls: num(/A11Y_CONTROLS_MAX\s*=\s*(\d+)/),
   ```
   Sans cette étape, les nouveaux seuils sont **relevables sans que personne ne le voie** :
   ils ne rentrent pas dans l'empreinte SHA-256.

4. **`.gate-baseline.json`** — re-figer. L'ajout au `fingerprint()` change le `hash`, donc
   la baseline doit être re-gelée **une seule fois**, avec la mention explicite du motif :
   ```bash
   node scripts/verify-gate-integrity.mjs --freeze
   ```
   Et dans le message de commit : `chore(gate): ajout des ratchets dsAdoption + a11yControls (ajout, jamais desserrement)`.

- **Critère** : `npm run preflight` passe, et une régression volontaire (ajouter un
  `<button>` muet) fait échouer la Gate 6.
- **Test de la garde elle-même** : ajouter temporairement un `<div onClick>` dans un
  fichier de test, lancer `node scripts/gate-last-mile.mjs`, vérifier `exit ≠ 0`, retirer.
- **Effort** : 4 h

### 0.4 — `[ ]` Sonde runtime M6 : ce que seul le rendu peut dire

**Fichier** : `tests/measure/layout-probe.spec.ts` (extension) ou nouveau
`tests/measure/a11y-probe.spec.ts` suivant la même structure.

La sonde M5 existante sait déjà ouvrir l'application, poser un viewport et lire le DOM
calculé. Elle mesure le débordement. Lui ajouter **quatre relevés qu'aucune analyse
statique ne peut produire** :

| Relevé | Pourquoi seul le rendu le sait |
|---|---|
| Ratio de contraste réel | La couleur finale dépend des tokens, du thème, du tenant et de la superposition des fonds |
| Nom accessible calculé | Il peut venir d'un `aria-labelledby` résolu ailleurs dans l'arbre |
| Taille de cible tactile | Elle dépend du padding hérité, pas de la classe écrite |
| Présence d'un anneau de focus | Un `outline` peut être annulé par une règle plus spécifique |

Le code de mesure — vérifié en session sur `http://localhost:3455` :

```ts
const releve = await page.evaluate(() => {
  const lum = (c: number[]) => {
    const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (s: string) => {
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  };
  // PIÈGE : remonter jusqu'au premier fond OPAQUE. S'arrêter au parent direct
  // donne rgba(0,0,0,0) et un ratio de contraste faux.
  const fondDe = (el: Element) => {
    let e: Element | null = el;
    while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.5) return c.rgb; e = e.parentElement; }
    return [255, 255, 255];
  };
  const ratio = (f: number[], b: number[]) => {
    const a = Math.max(lum(f), lum(b)), c = Math.min(lum(f), lum(b));
    return Math.round(((a + 0.05) / (c + 0.05)) * 100) / 100;
  };

  const contrastesKO: string[] = [];
  document.querySelectorAll('*').forEach(el => {
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent!.trim()).join(' ').trim();
    if (t.length < 2) return;
    const r = el.getBoundingClientRect(); if (r.width < 1) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    if (/DEV_MODE_ACTIVE/.test(el.textContent || '')) return;   // jamais livré
    const fg = parse(cs.color); if (!fg) return;
    const px = parseFloat(cs.fontSize), gras = parseInt(cs.fontWeight) >= 700;
    const seuil = (px >= 24 || (px >= 18.66 && gras)) ? 3 : 4.5;
    const cr = ratio(fg.rgb, fondDe(el));
    if (cr < seuil) contrastesKO.push(`${t.slice(0, 30)} — ${cr}:1 (seuil ${seuil}, ${Math.round(px)}px)`);
  });

  const sel = 'button,[role=button],a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const ctrls = [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0);
  const sansNom = ctrls.filter(e =>
    !(e as HTMLElement).innerText?.trim() && !e.getAttribute('aria-label') &&
    !e.getAttribute('title') && !e.getAttribute('aria-labelledby')).length;
  // PIÈGE : mesurer min(largeur, hauteur). Un bouton 200×20 passe un test sur la
  // largeur seule et reste pourtant impossible à viser au doigt.
  const ciblesPetites = ctrls.filter(e => {
    const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) < 44;
  }).length;

  let focusInvisible = 0;
  ctrls.slice(0, 12).forEach(e => {
    const avant = getComputedStyle(e).outlineWidth + '|' + getComputedStyle(e).boxShadow;
    (e as HTMLElement).focus();
    const apres = getComputedStyle(e).outlineWidth + '|' + getComputedStyle(e).boxShadow;
    if (avant === apres) focusInvisible++;
    (e as HTMLElement).blur();
  });

  return { contrastesKO, sansNom, ciblesPetites, focusInvisible, controles: ctrls.length };
});
```

**Routes à couvrir** — passer de 5 à 15, en priorisant celles qu'un employé utilise debout :

```ts
const ROUTES = [
  '/pos', '/kds', '/floor-plan', '/operations', '/inventory',        // existantes
  '/reservations', '/planning', '/staff', '/timeclock', '/hygiene',  // ajouts terrain
  '/finance', '/registre', '/kitchen', '/pos-mobile', '/login',      // ajouts gestion
];
```

- **Blocage connu** : `/login` et toute route protégée demandent désormais un PIN par
  compte. Prévoir un helper `tests/measure/session.ts` qui provisionne un compte de démo
  à PIN connu **en environnement de test uniquement** — voir § G.3.
- **Critère** : `.measures/runtime.json` contient `contrastesKO`, `sansNom`,
  `ciblesPetites`, `focusInvisible` pour 15 routes × 3 paliers.
- **Vérification** : `npm run measure:runtime`
- **Effort** : 1,5–2 j

---

## LOT A — Accessibilité · niveau 1 → 3

> **L'axe le plus faible, et le seul où une barrière automatique a été volontairement
> retirée.** À distinguer clairement : l'**ergonomie tactile** est bonne (pavé PIN mesuré
> à 80 × 85 px, bien au-delà des 44 px requis) ; c'est l'**accès non tactile** — clavier,
> lecteur d'écran, faible vision — qui est absent.

### A.1 — `[ ]` Réarmer le lint d'accessibilité

**Fichier** : `eslint.config.mjs` (ligne 50 : `"jsx-a11y/alt-text": "off"`)

```bash
npm i -D eslint-plugin-jsx-a11y
```

```js
// eslint.config.mjs
import jsxA11y from 'eslint-plugin-jsx-a11y';

// dans la config des fichiers TSX :
plugins: { 'jsx-a11y': jsxA11y },
rules: {
  ...jsxA11y.configs.recommended.rules,
  'jsx-a11y/alt-text': 'error',                          // ← réactivée
  // Dette existante, en cliquet décroissant : ces trois règles produisent aujourd'hui
  // ~240 violations. On les met en warn pour ne pas bloquer, avec un plafond compté.
  'jsx-a11y/click-events-have-key-events': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
}
```

- **Piège** : passer les trois règles à `error` d'emblée bloque tout commit et sera
  contourné par un `--no-verify`. Le cliquet décroissant (§ 0.3) est le bon levier.
- **Critère** : `npx eslint src --format json` produit un compte de warnings a11y
  reproductible ; ce compte devient `A11Y_LINT_MAX` dans `preflight.sh`.
- **Note** : `verify-gate-integrity.mjs` ne compte que les `no-restricted-imports: "off"` ;
  la réactivation d'`alt-text` ne modifie donc pas l'empreinte de la baseline.
- **Effort** : 0,5 j

### A.2 — `[ ]` Trancher `axe-config.ts` : brancher ou supprimer

**Fichier** : `src/shared/utils/a11y/axe-config.ts`

**Constat mesuré** : le fichier déclare 7 règles axe, expose `runAxeAudit()` et liste
3 chemins critiques (`/pos`, `/kds`, `/reservations`). Or :
- `axe-core` **n'est pas déclaré** dans `package.json` (présent en transitif seulement) ;
- `runAxeAudit` et `AXE_CORE_CONFIG` n'ont **aucun appelant** dans tout le dépôt ;
- l'import dynamique est enveloppé d'un `catch { return null }` **silencieux**.

C'est un stub déguisé : le fichier donne l'apparence d'un audit d'accessibilité et n'en
fait aucun. Deux issues acceptables, aucune troisième :

**Option 1 — le brancher** (recommandée)
```bash
npm i -D axe-core
```
```ts
// tests/measure/a11y-probe.spec.ts
import { AXE_CORE_CONFIG } from '@/shared/utils/a11y/axe-config';
// injecter axe dans la page Playwright et lancer sur AXE_CORE_CONFIG.criticalPaths
```
Et **retirer le `catch` silencieux** : si axe ne se charge pas, la sonde doit échouer
bruyamment, pas rendre `null`.

**Option 2 — le supprimer** : `git rm src/shared/utils/a11y/axe-config.ts`, en assumant
que l'accessibilité est mesurée par la sonde M6 (§ 0.4) qui, elle, calcule le contraste
sans dépendance externe.

- **Critère** : plus aucun fichier du dépôt ne prétend auditer sans auditer.
- **Effort** : 0,5 j (option 2) — 1 j (option 1)

### A.3 — `[ ]` Rendre le focus visible partout

**Fichier** : `src/app/globals.css`

**Constat mesuré au rendu** : sur l'application lancée, le bouton testé ne change **aucun
style** en recevant le focus. Un seul fichier du dépôt utilise `focus-visible`.

```css
/* globals.css — après le bloc @theme */
@layer base {
  :where(button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])):focus-visible {
    outline: 2px solid var(--color-focus, #C5A059);
    outline-offset: 2px;
    border-radius: 3px;
  }
  /* Le token --color-focus existe déjà (globals.css:58) et suit la charte du tenant :
     l'anneau de focus se re-teinte donc automatiquement en marque blanche. */
}
```

- **Piège** : utiliser `:where()` donne une spécificité **nulle**, donc toute règle
  composant peut encore la surcharger volontairement. Sans `:where()`, la règle globale
  écraserait des états de focus déjà soignés.
- **Vérification au rendu** : relancer la sonde M6, `focusInvisible` doit tomber à 0.
- **Effort** : 2 h

### A.4 — `[ ]` Les 38 poignées de clic non focalisables

**Constat** : 38 occurrences de `<div onClick>` dans 31 fichiers, **aucune** avec
`onKeyDown`. Ces actions n'existent pas au clavier.

**Elles se répartissent en trois familles — le traitement diffère** :

| Famille | Traitement | Exemples |
|---|---|---|
| **Voile de fermeture** (`fixed inset-0` cliquable pour fermer) | Ne pas ajouter de rôle. Ajouter `aria-hidden="true"` et gérer `Escape` sur la modale | `TrustedDevicePanel.tsx:322`, `FleetDeviceInventory.tsx:296`, `SettingsDashboard.tsx:260`, `TutorialBubble.tsx:153`, `CRMContactForm.tsx:114` |
| **Vraie action** (carte, ligne de tableau, onglet) | Remplacer par `<button>` ou ajouter `role="button" tabIndex={0} onKeyDown` | `WeeklyView.tsx`, `SectorStudyTab.tsx`, `TenantChangelogPanel.tsx` |
| **Capture technique** (`stopPropagation`, `onClickCapture`) | Aucun changement — ce n'est pas une cible | `ActionGuard.tsx:98`, `AppLaunchpad.tsx:141` |

Fichiers concernés (31) — liste complète en **annexe A.4**.

- **Critère** : `m12_a11yControls.extra.clavier` → 0, hors famille « capture technique »
  explicitement exclue par le motif de la mesure.
- **Effort** : 1,5 j

### A.5 — `[ ]` Les ~200 boutons muets

**Constat** : 198 à 205 boutons (selon la tolérance retenue sur les libellés dynamiques)
n'ont ni texte, ni `aria-label`, ni `title`. Ce sont presque tous des boutons-icône.

**Règle à appliquer** — un bouton-icône porte toujours son intention :
```tsx
// ❌ avant
<button onClick={onClose}><X size={18} /></button>

// ✅ après
<button onClick={onClose} aria-label={t('common.close')}>
  <X size={18} aria-hidden="true" />
</button>
```
`aria-hidden` sur l'icône évite que le lecteur d'écran annonce deux fois.

**Ordre de traitement** — commencer par les primitives partagées : les corriger une fois
répare tous leurs consommateurs d'un coup.

| Priorité | Fichier | Boutons muets |
|---|---|---:|
| 1 | `src/shared/components/ui/CameraCapture.tsx` | 3 |
| 1 | `src/shared/components/ui/Feedback.tsx` | 3 |
| 1 | `src/shared/components/ui/NotificationPanel.tsx` | 2 |
| 1 | `src/shared/components/ui/AutoSafeLayout.tsx` | 2 |
| 1 | `src/shared/nexus/guards/PinLogin.tsx` | 3 |
| 2 | `src/shared/components/TutorialBubble.tsx` | 2 |
| 2 | `src/shared/components/layout/sidebar/SidebarBranding.tsx` | 2 |
| 2 | `src/shared/components/settings/CustomDomainPanel.tsx` | 2 |
| 3 | les 20 fichiers métier suivants | 2 à 3 chacun |

> **Écran de connexion — vérifié au rendu** : 3 boutons sur 14 sans nom accessible.
> C'est le tout premier écran du produit : à traiter en priorité 1 même s'il n'est pas
> dans `shared/`. Voir `PinLogin.tsx`.

- **Critère** : `m12_a11yControls.extra.muets` → 0 ; sonde M6 `sansNom` → 0 sur les 15 routes.
- **Effort** : 2–3 j

### A.6 — `[ ]` Les quatre modales de sécurité de la caisse

> **La correction la plus rentable du plan.** Ce sont les écrans les plus sensibles du
> produit — saisie de code PIN, annulation de vente, ouverture de tiroir, procédure de
> secours — et ils sont **tous les quatre montés et atteignables** en production.

**Vérifié en session** : chargés dynamiquement dans `src/app/(client)/(ops)/pos/page.tsx`
lignes 16, 17, 19, 21 et rendus lignes 266, 267, 268, 274.

| Fichier | Lignes | `Escape` | `role="dialog"` | `aria-modal` | piège de focus |
|---|---:|:---:|:---:|:---:|:---:|
| `src/modules/commerce/ui/pos/PinModal.tsx` | 200 | ✅ | ❌ | ❌ | ✅ |
| `src/modules/commerce/ui/pos/VoidModal.tsx` | 204 | ❌ | ❌ | ❌ | ❌ |
| `src/modules/commerce/ui/pos/CashDrawerModal.tsx` | 226 | ❌ | ❌ | ❌ | ❌ |
| `src/modules/commerce/ui/pos/SosCaisseModal.tsx` | 286 | ❌ | ❌ | ❌ | ❌ |

`VoidModal` cumule les quatre manques : une annulation de vente — opération sous
contrainte fiscale NF525 — ne se ferme même pas au clavier.

**Traitement** : migrer sur la primitive `@ui/Modal`, qui porte déjà
`role="dialog"`, `aria-modal="true"`, `aria-labelledby` relié au titre, fermeture sur
`Escape` et bouton de fermeture nommé — le tout couvert par
`src/__tests__/ui/modal-accessibility.test.tsx` (3 tests).

```tsx
// patron de migration
import { Modal } from '@ui/Modal';

export function VoidModal({ isOpen, onClose, tenantId, operatorId }: VoidModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pos.void.title')}>
      {/* le corps existant, débarrassé de son <div className="fixed inset-0 …"> */}
    </Modal>
  );
}
```

**Garde-fous à ne pas casser** :
- `scripts/verify-figma-guardrails.mjs` **exige** la présence de `PinModal`, `VoidModal`,
  `SosCaisseModal` et `CashCounterModal` dans la page POS. Ne pas renommer les exports.
- `src/__tests__/architecture/figma-redesign-guardrails.test.ts` vérifie que
  `CashCounterModal` applique les microunits et n'a pas de handler inerte.
- **Vérifier après migration** : `npm run check:figma-guard && npx vitest run figma-redesign`

**Note d'architecture (hors périmètre, à signaler)** : ces quatre modales vivent sous
`src/modules/commerce/ui/pos/` alors que le POS relève du pilier `ops` (`ops/service/pos/`).
Ce n'est pas un doublon — les fichiers sont complémentaires — mais c'est une entorse à la
taxonomie des piliers. À traiter dans un lot d'architecture, pas ici.

- **Critère** : les 4 fichiers utilisent `<Modal>` ; la sonde M6 sur `/pos` ne remonte
  ni `sansNom` ni modale sans `role`.
- **Effort** : 1 j

### A.7 — `[ ]` Les 29 autres modales faites main

Même patron que A.6, sans urgence de sécurité. Liste complète en **annexe A.7**.

**Deux cas particuliers** :
- `src/shared/components/ui/BottomSheet.tsx` — c'est une **primitive**, pas un écran.
  Elle doit devenir accessible elle-même (`role="dialog"`, `aria-modal`, `Escape`,
  piège de focus) plutôt que d'utiliser `Modal` : les deux sont des primitives sœurs.
  À traiter en premier : elle est utilisée par la page POS (`pos/page.tsx:9`).
- `src/modules/compliance/qualite/haccp/components/cleaning-plan/CleaningPinDialog.tsx`
  (71 l.) — deuxième saisie de PIN du produit, à aligner sur `PinModal` après A.6.

**Découpage suggéré en 4 passes** (une par pilier, pour rester dans un périmètre de session) :

| Passe | Pilier | Modales | Effort |
|---|---|---:|---|
| 1 | `shared/` + `compliance/` | 4 | 0,5 j |
| 2 | `commerce/` | 8 | 1 j |
| 3 | `facility/` + `human/` | 8 | 1 j |
| 4 | `logistics/` + `finance/` + `intelligence/` + `ops/` + `app/` | 9 | 1 j |

- **Critère** : `m12_a11yControls.extra.modales` → 0.
- **Effort** : 3,5 j

---

## LOT B — Typographie · niveau 2 → 4

### B.1 — `[ ]` Réparer la police de marque

> **Vérifié au rendu**, pas déduit du code. Sur `http://localhost:3455/pos` :
> `document.fonts` contient une entrée `Playfair Display` **au statut `error`** ;
> `document.fonts.check("64px 'Playfair Display'")` renvoie `false` ; et la mesure de
> largeur d'un même texte donne **559,2 px** pour `font-brand` — identique à Georgia
> (559,2 px), différent de Playfair (525 px). **`font-brand` s'affiche donc en Georgia.**

**Mécanique en cause** — elle est *voulue*, c'est sa résilience qui manque :
- `src/app/layout.tsx` charge trois polices par `next/font/google` : Inter (`--font-inter`),
  Cormorant Garamond (`--font-serif`), JetBrains Mono (`--font-mono`).
- `src/app/globals.css:91` déclare `--font-brand: var(--font-brand, 'Playfair Display', Georgia, serif)`
  — auto-référence dont le repli est Playfair.
- La vraie valeur de `--font-brand` est injectée **à l'exécution par tenant** :
  `src/shared/nexus/tokens/verticals/restaurant.ts` fournit `fontBrand: 'Playfair Display'`
  et `fontBrandUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display…'`.
- Ce chargement distant échoue (réseau, CSP, hors-ligne) → aucun repli local → Georgia.

**Conséquence de conception, pas seulement de bug** : `font-serif` (**641 usages**) rend
en Cormorant Garamond tandis que `font-brand` (**32 usages**) vise Playfair. Le produit a
donc **deux serifs de marque divergents**.

**Trois décisions à prendre, dans l'ordre** :

1. **`[ ]` Trancher la police de marque par défaut.** Soit Cormorant (déjà chargée,
   déjà majoritaire à 641 contre 32), soit Playfair. Si Cormorant : supprimer la piste
   Playfair de `globals.css:89,91` et aligner `--font-brand` sur `--font-serif`.
2. **`[ ]` Donner un repli local à la police de marque tenant.** La marque blanche doit
   rester possible, mais son échec ne doit pas dégrader silencieusement :
   ```ts
   // BrandingProvider — à l'injection de fontBrandUrl
   const face = new FontFace(tokens.fontBrand, `url(${tokens.fontBrandUrl})`);
   face.load()
     .then(f => document.fonts.add(f))
     .catch(() => {
       logger.warn('[Branding] police de marque indisponible, repli sur la police par défaut', { font: tokens.fontBrand });
       document.documentElement.style.setProperty('--font-brand', 'var(--font-serif)');
     });
   ```
   > **Interdit** : un `catch {}` vide. L'échec doit se voir dans les journaux — c'est
   > précisément la classe d'erreur que la mesure « erreurs avalées » (200 occurrences)
   > cherche à faire reculer.
3. **`[ ]` Ajouter un invariant.** Test d'architecture vérifiant qu'aucune variable de
   police ne s'auto-référence sans repli chargé :
   ```ts
   it('INV-25 — toute police de marque a un repli effectivement chargé', () => {
     const css = readFileSync('src/app/globals.css', 'utf-8');
     const layout = readFileSync('src/app/layout.tsx', 'utf-8');
     for (const m of css.matchAll(/--font-(\w+):\s*var\(--font-\1,\s*'([^']+)'/g)) {
       expect(layout, `police ${m[2]} référencée en repli mais jamais chargée`).toContain(m[2].split(' ')[0]);
     }
   });
   ```

- **Vérification au rendu** — la seule qui prouve quelque chose :
  ```js
  // dans la console de la page, après document.fonts.ready
  [...document.fonts].filter(f => f.status === 'error').map(f => f.family)   // doit être []
  ```
- **Effort** : 0,5 j

### B.2 — `[ ]` Tokeniser l'échelle typographique

**Constat** : 13 échelons Tailwind utilisés (l'échelle est globalement respectée) **mais**
189 tailles arbitraires `text-[…]` sur 21 valeurs distinctes — dont 12 px (×62),
13 px (×43), 14 px (×26). Ces trois valeurs à elles seules font 131 des 189 occurrences.

**Il n'existe aucune échelle typographique nommée** dans `globals.css` : les tokens
couvrent la couleur, le rayon, l'ombre, la durée et les points de rupture — pas la taille
de texte.

```css
/* globals.css — dans @theme, à côté de --radius-* */
--text-micro:  0.6875rem;  /* 11px — plancher absolu, légendes d'impression uniquement */
--text-caption:0.75rem;    /* 12px — remplace les 62 text-[12px] */
--text-body-s: 0.8125rem;  /* 13px — remplace les 43 text-[13px] */
--text-body:   0.875rem;   /* 14px — remplace les 26 text-[14px] */
```

Puis substitution mécanique : `text-[12px]` → `text-caption`, etc.

- **Critère** : mesure `responsive.extra.microTypo` inchangée ou en baisse **et**
  tailles arbitraires ≤ 20 occurrences.
- **Effort** : 0,5 j

### B.3 — `[ ]` Trancher `font-bold` contre `font-black`

**Constat** : `font-bold` 1 684 usages, `font-black` 1 603. Deux graisses d'emphase à
quasi-égalité, sans convention écrite : c'est un choix laissé au hasard de qui écrit l'écran.

**Décision à prendre et à documenter dans `docs/CODING_STANDARDS.md`** — proposition :

| Rôle | Graisse | Justification |
|---|---|---|
| Titre éditorial, KPI, chiffre-clé | `font-black` | La charte « Vanguard » assume une frappe forte sur les valeurs |
| Titre de section, libellé de bouton, en-tête de tableau | `font-bold` | Emphase de structure |
| Texte courant, libellé de champ | `font-medium` / `font-normal` | — |

- **Critère** : la règle est écrite ; l'écart entre les deux compteurs devient significatif
  (l'un doit dominer nettement) à la mesure suivante.
- **Effort** : 0,5 j de décision + application au fil de l'eau

### B.4 — `[ ]` Les 32 textes sous 12 px

**Concentration** : **14 des 32** sont dans un seul fichier,
`src/app/(admin)/admin/mcc/components/CertPreviewPanel.tsx` (de 4,5 px à 7 px).

C'est un **aperçu de certificat à l'échelle** — un fac-similé de document imprimé.
Ce n'est pas un défaut d'accessibilité : personne n'est censé lire ces textes à l'écran.

**Traitement** :
- `[ ]` Exclure ce fichier de la mesure `microTypo` par une exception nommée dans
  `measures.mjs` (avec le commentaire expliquant pourquoi), plutôt que d'accepter un
  bruit permanent de 14 occurrences.
- `[ ]` Traiter les 18 restantes : plancher à 11 px (`--text-micro`), en priorité
  `Cart.tsx:69,74` et `PaymentMethodSelector.tsx:46` — écrans de caisse, lus en biais
  et dans l'urgence.

- **Effort** : 0,5 j

---

## LOT C — Couleur & contraste · niveau 3 → 4

> **L'axe où l'intention est la plus aboutie.** `src/shared/nexus/tokens/semantic.ts`
> (167 l.) définit des **rôles** — action, surface, statut, texte, bordure — et non des
> teintes, avec surcharge par tenant et gestion clair/sombre. Le système est bon ;
> il est court-circuité.

### C.1 — `[ ]` Corriger le contraste des tokens de texte

> **Mesuré au rendu** sur l'écran de connexion à 768 × 1024 : **3 textes sur 6** sous le
> seuil WCAG AA — `Sécurité Chiffrée` **2,22:1**, `Souverain (Admin)` **2,29:1**,
> `Retour` **2,37:1**, tous à 12 px pour un seuil requis de 4,5:1.

Ce n'est pas trois bugs isolés : ce sont les tokens `text-secondary` / `text-tertiary` /
`text-muted` appliqués sur des surfaces claires. Le corriger **au token** répare tous les
écrans d'un coup — c'est le rare endroit où la faible adoption du design system n'empêche
pas une correction centrale, puisque les classes de couleur sémantiques, elles, sont
largement utilisées.

**Fichiers** : `src/shared/nexus/tokens/semantic.ts` (bloc `text`), `src/app/globals.css` (lignes 47-50).

```ts
// semantic.ts — bloc text
text: {
  primary:   palette.neutral[900],   // inchangé
  secondary: palette.neutral[600],   // ← était neutral[500] : 2,29:1 → ≈ 4,7:1 sur neutral[50]
  tertiary:  palette.neutral[500],   // ← était neutral[400]
  muted:     palette.neutral[500],   // ← était neutral[400]
  // …
}
```

- **Piège** : ne pas corriger « à l'œil ». Recalculer le ratio pour chaque couple
  (couleur de texte × surface) réellement employé, dans les **deux thèmes**.
- **Vérification** : sonde M6 sur les 15 routes, `contrastesKO` → 0.
- **Effort** : 1 j

### C.2 — `[ ]` Réduire la palette Tailwind brute

**Constat** : **2 785** usages sur 148 combinaisons. Les plus fréquents sont des
**statuts** qui ont déjà leur token : `emerald-500` ×267 (= `status.success`),
`amber-500` ×257 (= `status.warning`), `red-500` ×139 (= `status.danger`),
`gray-700` ×165 (= `text.secondary`).

**Concentration exploitable** — les 5 premiers fichiers concentrent 344 occurrences :

| Fichier | Occ. | Note |
|---|---:|---|
| `src/app/(public)/legal/rgpd/page.tsx` | 127 | page légale, hors application |
| `src/modules/commerce/acquisition/onboarding/wizard/OnboardingWizard.tsx` | 66 | **écran produit — prioritaire** |
| `src/app/(public)/legal/mentions/page.tsx` | 56 | page légale |
| `src/app/(public)/legal/cgv/page.tsx` | 52 | page légale |
| `src/app/(public)/legal/cgu/page.tsx` | 48 | page légale |

**Décision de périmètre** : les quatre pages légales (283 occurrences, 10 % du total) sont
des documents statiques, hors marque blanche tenant. **Les exclure explicitement** de la
mesure plutôt que de les migrer — sinon on paye une migration sans bénéfice.

**Ordre de traitement du reste** : `OnboardingWizard.tsx` (66) → `SimpleFloorPlanEditor.tsx`
(43) → `OnboardingChecklistSettingsPanel.tsx` (41) → `EquipmentAssetCard.tsx` (36) →
`DLQDiagnosticPanel.tsx` (33) → `TableButton.tsx` (30).

> `TableButton.tsx` mérite une attention particulière : les couleurs de statut de table
> (`libre`, `occupée`, `réservée`, `à nettoyer`) **existent déjà** dans `semantic.ts`
> sous `status.tableAvailable`, `tableOccupied`, `tableReserved`, `tableCleaning`.
> Le fichier réinvente ce que le token fournit.

- **Critère** : ≤ 400 occurrences hors pages légales exclues.
- **Effort** : 2–3 j

### C.3 — `[ ]` Purger les hex codés en dur

**Constat** : 369 occurrences sur 120 valeurs distinctes. La plus fréquente est `#C5A059`
(×57) — l'or de la marque, qui a pourtant un token (`--color-brand`, `action.primary`).

| Fichier | Occ. | Traitement |
|---|---:|---|
| `src/shared/components/settings/SettingsDashboard.tsx` | 30 | migrer vers tokens |
| `src/modules/commerce/acquisition/onboarding/wizard/SimpleFloorPlanEditor.tsx` | 16 | migrer |
| `src/shared/components/layout/MobileNavBar.tsx` | 15 | migrer |
| `src/modules/ops/production/kitchen/components/tabs/AllergensTab.tsx` | 14 | **exception** : couleurs réglementaires d'allergènes, à documenter, pas à tokeniser |
| `src/modules/facility/spaces/floor-plan/FloorPlanEditor.tsx` | 13 | migrer |
| `src/shared/components/settings/BrandingPanel.tsx` | 11 | **exception** : aperçus de charte, l'hex est la donnée |

> **Piège déjà commis lors d'un audit antérieur** : `BrandingPanel.tsx` et les composants
> d'aperçu de charte affichent des couleurs *en tant que contenu*. Les compter comme dette
> produit des faux positifs. Les exclure nommément dans la mesure.

- **Critère** : ≤ 40 occurrences hors exceptions documentées.
- **Effort** : 1,5 j

---

## LOT D — Composants & design system · niveau 2 → 4

> **L'axe où l'écart entre l'effort consenti et le bénéfice obtenu est le plus grand.**
> 51 primitives, 53 exports de barrel, 180 composants partagés — utilisés par 22 % des écrans.

### D.1 — `[ ]` Consolider les cinq variantes de carte

**Constat** : `StatCard` ×98, `GlassCard` ×22, `SectionCard` ×18, `PremiumCard` ×3,
`Card` ×2 — plus **411 cartes refaites à la main**. Cinq composants pour un concept,
dont deux quasi inutilisés.

**Cible : deux composants.**

| Garder | Rôle | Absorbe |
|---|---|---|
| `SectionCard` | conteneur de section, avec `variant: default \| glass \| premium \| ghost` — **les quatre variantes existent déjà** et sont exposées dans `/design-system` | `Card`, `GlassCard`, `PremiumCard` |
| `StatCard` | tuile de chiffre-clé — usage distinct, 98 consommateurs | — |

**Migration** :
1. `[ ]` `Card` (2 usages) → `<SectionCard variant="default">`
2. `[ ]` `PremiumCard` (3 usages) → `<SectionCard variant="premium">`
3. `[ ]` `GlassCard` (22 usages) → `<SectionCard variant="glass">`
4. `[ ]` Marquer les trois anciens `@deprecated` avant suppression, puis supprimer du barrel
5. `[ ]` Attaquer les 411 cartes manuelles — **par pilier**, en commençant par celui qui en
   a le plus (à mesurer avec M11 `extra.cartesMain` détaillé par fichier)

- **Effet de bord attendu** : la mesure « composants exportés sous un nom déjà pris »
  (27) doit baisser.
- **Effort** : 3–4 j

### D.2 — `[ ]` Les champs de saisie — l'axe le plus dégradé

**Constat** : **446 `<input>` bruts** dans 212 fichiers contre **43** champs encapsulés,
soit **9 % d'adoption**. C'est le pire ratio du dépôt.

**Cause probable** : la primitive `Input.tsx` existe (`shared/components/ui/Input.tsx`) mais
n'a **que 3 usages** ; ce sont `PremiumSelect` (28) et `TimeInput` (5) qui portent l'essentiel.
Autrement dit la primitive de saisie de base n'a jamais pris.

**Avant de migrer 446 champs, comprendre pourquoi elle n'a pas pris** :
- `[ ]` Comparer l'API de `Input.tsx` avec 5 usages bruts représentatifs. Manque-t-il un
  `label`, un état d'erreur, un suffixe, un mode numérique tactile ?
- `[ ]` Si l'API est insuffisante, **la corriger d'abord**. Migrer vers une primitive
  inadéquate produit 446 contournements.

**Ce que la primitive doit fournir pour valoir la migration** :
```tsx
<Input
  label={t('staff.firstName')}      // ← relie <label for> et id : règle jsx-a11y/label satisfaite
  error={errors.firstName}          // ← aria-invalid + aria-describedby
  inputMode="numeric"               // ← clavier tactile adapté, essentiel en salle
  required
/>
```
> 451 `<input>` pour 431 `<label>` : le rapport est bon, mais rien ne garantit que
> l'association `for`/`id` est faite. Une primitive la garantit par construction.

- **Critère** : ≥ 350 champs encapsulés ; règle `jsx-a11y/label` sans violation.
- **Effort** : 4–5 j (dont 1 j d'analyse de l'API avant toute migration)

### D.3 — `[ ]` Les boutons

**Constat** : 1 183 `<button>` bruts contre 158 `<Button/>` — 12 % d'adoption.

**Même prudence que D.2** : avant de migrer, vérifier que `Button.tsx` couvre les usages
réels. Les 5 fichiers les plus denses donnent un échantillon représentatif :

| Fichier | Boutons bruts |
|---|---:|
| `src/app/(client)/(ops)/pos/_panels/CartItemContextMenu.tsx` | 12 |
| `src/modules/ops/service/pos/components/PosHeader.tsx` | 12 |
| `src/modules/commerce/acquisition/onboarding/wizard/OnboardingWizard.tsx` | 11 |
| `src/modules/ops/service/kiosk/KioskPage.tsx` | 10 |
| `src/app/(admin)/admin/mcc/page.tsx` | 9 |

**Bénéfice croisé** : une primitive `Button` qui impose `aria-label` quand `children` est
une seule icône **ferme définitivement** le chantier A.5 pour tous ses consommateurs.

```tsx
// Button.tsx — garde de développement
if (process.env.NODE_ENV !== 'production') {
  const iconeSeule = typeof children !== 'string' && !ariaLabel && !title;
  if (iconeSeule) logger.warn('[Button] bouton-icône sans aria-label', { variant });
}
```

- **Critère** : ≥ 900 `<Button/>`, ≤ 300 `<button>` bruts.
- **Effort** : 4–5 j

### D.4 — `[ ]` Trancher les 78 composants orphelins

**Répartition mesurée** :

| Pilier | Orphelins |
|---|---:|
| `modules/compliance` | 23 |
| `modules/commerce` | 14 |
| `shared/components` | 11 |
| `modules/finance` | 8 |
| `modules/ops` | 8 |
| `modules/intelligence` | 6 |
| `modules/human` | 3 |
| `modules/logistics` | 3 |
| `modules/facility` | 2 |

**Constat aggravant** : **0 composant marqué `@wip`**, alors que la Loi 8 prévoit
explicitement ce marqueur pour un composant écrit avant son écran. Résultat : impossible
de distinguer une exploration assumée d'un oubli.

**Trois issues par composant, aucune quatrième** :
1. **Le monter** — il a un écran, il faut le brancher (Loi 8, point 1)
2. **Le marquer `@wip`** avec propriétaire et échéance — la mesure `m1_reachability`
   l'exclut déjà (`if (/@wip\b/.test(src)) continue`)
3. **Le supprimer** — coût déjà payé, valeur nulle, il encombre

Commencer par `modules/compliance` (23) : c'est le pilier le plus touché, et le domaine
où un composant non monté peut faire croire qu'une obligation réglementaire est couverte.

- **Critère** : `ORPHAN_COMPONENTS_MAX` descendu de 78 à ≤ 20 dans `preflight.sh`
  **et** `.gate-baseline.json` re-figé à la baisse.
- **Effort** : 2–3 j

---

## LOT E — Mise en page & grilles · niveau 3 → 4

> **La discipline d'espacement est réellement tenue** : 15 espacements arbitraires sur
> ~15 000 usages. C'est rare et il faut le dire — ce lot ne touche pas à ça.

### E.1 — `[ ]` Généraliser `PageShell`

**Constat** : 66 pages sur 84 n'utilisent pas `<PageShell>`, alors que la primitive
représente 728 lignes de travail et porte les en-têtes éditoriaux normalisés (ADR-017).

**Toutes les pages ne doivent pas l'utiliser.** Classer d'abord :

| Catégorie | Nombre | Décision |
|---|---:|---|
| Écrans d'exploitation (`(client)/(ops)/*`) hors plein cadre | **18** | **Doivent** utiliser `PageShell` |
| Console MCC (`(admin)/*`) | **14** | **Doivent** — cohérence de la console |
| Écrans plein cadre — `/pos`, `/pos-mobile`, `/kds`, `/kiosk`, `/floor-plan` | 5 | **Exclus** — pas d'en-tête, surface totale |
| Pages marketing (`(marketing)/*`) | 11 | **Exclues** — charte éditoriale distincte |
| Portail public tenant (`(client)/(public)/*`) | 8 | **Exclues** — landing, vitrine, connexion |
| Pages légales (`(public)/legal/*`) | 4 | **Exclues** — documents |
| Racine et pages `[slug]` | 3 | **Exclues** |
| `(public)` autres — `/demo`, `/status` | 2 | **Exclues** |
| Commande en ligne (`(client)/(ordering)/*`) | 1 | **Exclue** — parcours client final |

**Cible réelle : 32 pages à migrer, 34 exclues** — pas 66. Documenter ces 34 exclusions
ici pour qu'elles ne soient pas re-comptées comme dette au prochain audit.

> Régénérer la classification : parcourir `src/app/**/page.tsx`, retenir ceux sans
> `<PageShell`, classer par groupe de route. Résultat mesuré le 2026-08-27 : 66 / 84.

- **Effort** : 2–3 j

### E.2 — `[ ]` Corriger les risques responsive localisés

| Risque | Occ. | Action |
|---|---:|---|
| Largeurs px figées sans variante | 88 | Remplacer par `min-w-*` / `max-w-*` ou une variante par palier |
| `<table>` sans conteneur `overflow-x` | 12 | Envelopper : `<div className="overflow-x-auto">` |
| `h-screen` strict | 9 | Remplacer par `min-h-screen` sauf besoin avéré de hauteur imposée |

**Les 11 tables localisées** — 4 sont des pages marketing (impact commercial : un tableau
comparatif rogné sur mobile), 7 sont des écrans produit :

```
src/app/(marketing)/legal/security/page.tsx:49
src/app/(marketing)/legal/dpa/page.tsx:42
src/app/(marketing)/pricing/vs-lightspeed/page.tsx:39
src/app/(marketing)/pricing/vs-zelty/page.tsx:39
src/app/(admin)/admin/mcc/dlq/page.tsx:127
src/app/(client)/(ops)/staff/_tabs/PayrollTab.tsx:36          ← bulletins de paie
src/modules/facility/components/equipment/detail-modal/DetailInvoiceTab.tsx:84
src/modules/facility/maintenance/registre/DUERPSection.tsx:74  ← document réglementaire
src/modules/facility/maintenance/registre/IncendieSection.tsx:47
src/modules/finance/components/accounting/views/PlaceholderViews.tsx:49
src/modules/finance/components/accounting/views/JournalEntriesView.tsx:57  ← écritures NF525
```

> **Priorité** : `JournalEntriesView` (écritures comptables scellées) et `PayrollTab`
> (bulletins) — un tableau rogné y fait disparaître des colonnes légalement exigibles.

> **Piège encodé dans la mesure existante, à ne pas défaire** : `h-screen` (hauteur
> imposée, dangereuse) et `min-h-screen` (plancher, bénin) sont deux choses différentes.
> Les 63 `min-h-screen` ne sont **pas** de la dette. Un audit antérieur les a confondus
> et a annoncé 69 problèmes au lieu de 9.

- **Effort** : 1,5 j

### E.3 — `[ ]` Penser les grands écrans

**Constat** : `md` 689 usages, `lg` 352, mais `xl` 56 et `2xl` **12**. La conception
s'arrête en pratique à la tablette. Sur un écran de bureau de gestion, les interfaces
s'étirent sans se réorganiser.

- `[ ]` Choisir 6 écrans de gestion (finance, staff, analytics, inventory, reservations,
  registre) et leur donner un vrai comportement `xl` : passage en colonnes, panneau latéral
  de détail plutôt que modale, tableau plus dense.
- `[ ]` Ajouter un quatrième palier à la sonde M6 : **1 440 px**. Aujourd'hui elle
  s'arrête à 1 024 px, donc elle ne peut rien voir de ce problème.
- `[ ]` Corriger les 8 grilles à colonnes figées.

- **Effort** : 2 j

---

## LOT F — La boucle utilisateur manquante

> **Aucune dépendance, aucun code.** Ce lot est parallélisable dès aujourd'hui et c'est
> celui qui a le meilleur rendement par jour investi : il fait passer quatre axes
> (Personas, Entretiens, Tests, Parcours) et conditionne la pertinence de tous les autres.

### F.1 — `[ ]` Quatre vraies fiches persona

**Constat** : 4 personas existent — `src/e2e/simulator/personas/{alice,bob,carl,dave}.ts`,
251 lignes — et sont même **exécutables**. Mais ce sont des séquences d'appels
`Nexus.adapter.set/update` : aucun objectif, aucune douleur, aucun contexte physique.

**La matière première est déjà là** : la matrice RBAC compte **11 rôles**, soit une
segmentation plus fine que les 4 personas actuelles.

**Gabarit — une page par persona**, à placer en annexe de ce fichier :

```markdown
### Bob — serveur en salle
- **Rôle RBAC** : waiter
- **Ce qu'il essaie de faire** : encaisser une table de 6 qui veut payer en 3 fois,
  pendant que 2 autres tables attendent leur addition.
- **Contexte physique** : debout, tablette dans une main, terminal de paiement dans
  l'autre, bruit ambiant élevé, écran gras, parfois des gants.
- **Contrainte de temps** : < 90 s par encaissement, sinon la file s'allonge.
- **Ce qui fait échouer la tâche** : une modale qui ne se ferme pas au retour ; une
  cible tactile trop petite ; un montant illisible à 60 cm de distance.
- **Ce qu'il ne fera jamais** : lire une aide, appeler le support pendant le service.
- **Écrans concernés** : /pos, /pos-mobile, /floor-plan
```

**Vérification de qualité de la fiche** : si elle ne permet pas de trancher un arbitrage
d'interface concret, elle est trop vague. Test : « Bob peut-il utiliser une modale sans
bouton de fermeture visible ? » — la fiche doit y répondre.

- **Critère** : 4 fiches (serveur, chef de cuisine, gérant, administrateur MCC), chacune
  rattachée à un rôle RBAC réel et à des écrans nommés.
- **Effort** : 1 j

### F.2 — `[ ]` Rendre les parcours lisibles

**Constat** : les parcours critiques existent et **s'exécutent** — 8 suites Playwright,
35 tests, 139 interactions. C'est une documentation qui ne périme pas.
Mais un parcours écrit en Playwright **ne peut être ni relu ni contesté par un gérant**,
alors que c'est lui qui sait si l'ordre des étapes est le bon.

**Action** : dériver un diagramme Mermaid par parcours, **depuis** les specs existantes
(pas en parallèle — un diagramme qui diverge du test est pire que pas de diagramme).

| Parcours | Spec source | Lignes |
|---|---|---:|
| Onboarding d'un nouveau tenant | `tests/e2e/onboarding.spec.ts` | 197 |
| Encaissement fractionné | `tests/e2e/pos-split-payment.spec.ts` | 99 |
| Cycle de vie du tiroir-caisse | `tests/e2e/cash-drawer-lifecycle.spec.ts` | 81 |
| Flux cuisine | `tests/e2e/kds-kitchen-flow.spec.ts` | 63 |
| Parcours vital | `tests/e2e/vital-flow.spec.ts` | 76 |
| Matrice RBAC | `tests/e2e/rbac-matrix.spec.ts` | 22 |

- `[ ]` Pour chaque parcours : diagramme + **point de douleur identifié** à chaque étape
  (« ici Bob doit attendre 3 s sans indication »).
- **Critère** : les 6 diagrammes sont revus par une personne non développeuse.
- **Effort** : 1,5 j

### F.3 — `[ ]` Protocole de test d'utilisabilité

**Constat** : 0 occurrence de « test d'utilisabilité », « usability » ou « utilisabilité »
dans tout le dépôt. Un robot confirme qu'un chemin **fonctionne** ; il ne dira jamais
qu'il est **pénible**.

**Protocole minimal viable — 5 personnes, 1 h chacune, une fois par trimestre** :

1. `[ ]` Recruter 5 utilisateurs réels : 2 serveurs, 1 chef, 1 gérant, 1 nouvel embauché
   (le nouvel embauché est le plus précieux : il révèle ce que l'habitude masque).
2. `[ ]` 4 tâches, énoncées en langage métier, jamais en langage produit :
   - « Une table de 6 veut payer en 3 fois. »
   - « Tu t'es trompé de plat, annule-le. »
   - « Prends ton service et déclare ton arrivée. »
   - « Le tiroir ne s'ouvre pas, débrouille-toi. »
3. `[ ]` Consigne : penser à voix haute, ne jamais aider avant 2 minutes de blocage.
4. `[ ]` Relever : temps par tâche, nombre de blocages, verbatims, abandons.
5. `[ ]` Restituer dans `docs/UX-TESTS-<date>.md` : 1 page, 5 problèmes classés par
   nombre d'utilisateurs touchés.

> **Règle** : chaque problème rencontré par ≥ 3 des 5 utilisateurs devient une ligne de
> ce plan. C'est ce qui referme la boucle.

- **Effort** : 2 j par campagne

### F.4 — `[ ]` Télémétrie d'usage souveraine

**Constat** : PostHog n'est monté que sur le site vitrine
(`src/app/(marketing)/components/AnalyticsProvider.tsx`, 63 l.), avec `autocapture: false`
et sous condition de clé d'environnement. **Zéro événement d'usage n'est collecté dans
l'application elle-même.**

**Contrainte** : ne pas ajouter de tiers dans le produit. Le bus d'événements Nexus existe
déjà et respecte l'isolation par tenant — c'est le bon canal.

**12 événements à émettre**, choisis pour répondre à des questions précises :

| Événement | Question à laquelle il répond |
|---|---|
| `ux.screen.viewed` | Quels écrans ne sont jamais atteints ? |
| `ux.flow.abandoned` | Où les gens abandonnent-ils un encaissement ? |
| `ux.action.retried` | Quelle action faut-il reprendre deux fois ? |
| `ux.modal.dismissed_without_action` | Quelle modale est systématiquement fermée sans rien faire ? |
| `ux.search.empty` | Que cherche-t-on qu'on ne trouve pas ? |
| `ux.error.shown` | Quelles erreurs voit-on réellement ? |
| `ux.help.opened` | Où l'aide est-elle appelée ? (= où l'interface échoue) |
| `ux.offline.entered` | Combien de temps passe-t-on hors ligne ? |
| `ux.session.duration` | Combien de temps dure un service ? |
| `ux.device.class` | Sur quoi travaille-t-on vraiment ? |
| `ux.role.active` | Quel rôle utilise quel écran ? |
| `ux.feature.first_use` | Une fonctionnalité livrée est-elle jamais utilisée ? |

**Règles non négociables** :
- Rien de nominatif. Identifiant de session, pas d'utilisateur.
- Tout reste dans le tenant — `SovereignGuard` s'applique comme à toute écriture.
- Réglage tenant `telemetry.uxEnabled`, **lu** par le code (sinon il rejoint les
  177 réglages déclarés que personne ne lit).

- **Critère** : au bout d'un mois, on peut répondre par une donnée à
  « quels écrans ne sont jamais atteints ? » — question qu'aucun audit statique ne peut trancher.
- **Effort** : 2–3 j

---

## LOT G — Outils de design & prototypage

### G.1 — `[ ]` Faire de `/design-system` le catalogue de référence

**Constat** : la page existe (`src/app/(admin)/design-system/page.tsx`, 376 l.) et fait
déjà une partie du travail d'un Storybook : variantes de `SectionCard`, `ActionBar`,
`EmptyState`, `SkeletonList`, simulation de visibilité par rôle, aperçu PWA, bascule de
verticale. **Aucune dépendance Storybook n'est nécessaire** — l'étendre coûte moins qu'en
installer un.

À ajouter :
- `[ ]` L'échelle typographique (§ B.2) rendue, avec les ratios de contraste calculés en direct
- `[ ]` Les 51 primitives, pas seulement 6 — au minimum `Button`, `Input`, `Modal`,
  `DataView`, `StatCard`, `Toast`
- `[ ]` Un rendu côte à côte clair / sombre
- `[ ]` Les états : normal, survol, focus, désactivé, chargement, erreur
- `[ ]` Un lien depuis chaque fiche vers le fichier source

- **Effort** : 2 j

### G.2 — `[ ]` Documenter les gabarits de page comme wireframes

**Constat** : 0 occurrence de « wireframe » ou « maquette » dans le dépôt. Ce qui en tient
lieu est structurel : 12 blueprints de verticale et la primitive `PageShell`. C'est un
gabarit **compilé**, pas dessiné — il impose une structure sans permettre de la discuter
avant de l'écrire.

- `[ ]` Extraire de `PageShell` les 4 ou 5 dispositions réellement employées
  (liste + détail, tableau de bord, éditeur plein cadre, formulaire, assistant)
- `[ ]` Une page de ce document par disposition : schéma ASCII ou Mermaid, quand l'employer,
  quand ne pas l'employer
- `[ ]` Rendre ces dispositions choisissables dans le scaffolding `vertical-forge`

- **Effort** : 1,5 j

### G.3 — `[ ]` Rouvrir la démonstration

**Constat vérifié en session** : l'écran « Accès Exécutif » exige désormais un code PIN par
compte (« Chaque compte exige désormais son propre code PIN chiffré »). La démonstration
n'est plus ouvrable en un clic, ce qui pénalise à la fois l'usage commercial du prototype
et la couverture de la sonde runtime, bloquée hors des écrans protégés.

- `[ ]` Prévoir un compte de démonstration à PIN connu, **strictement conditionné à
  `NODE_ENV !== 'production'`** — le verrouillage de `?simulacra=true` sur cette même
  condition existe déjà et sert de patron.
- `[ ]` Exposer ce PIN dans `tests/measure/session.ts` pour débloquer § 0.4.
- **Interdit** : tout contournement d'authentification qui survivrait à un build de production.

- **Effort** : 0,5 j

### G.4 — `[ ]` Parité des langues

**Constat** : `fr` = 468 clés (référence). `en` 97 % (13 manquantes). `es`, `pt`, `ja`
**28 %** — 337 clés manquantes chacune.

- `[ ]` Décider : ou bien on complète, ou bien on **retire ces trois langues du sélecteur**.
  Une langue à 28 % affiche des clés brutes à l'écran — c'est pire que son absence.
- `[ ]` Ne jamais traduire les libellés réglementaires (NF525, FEC, PCG), qui restent en
  français légal.
- **Note** : la mesure « clés appelées mais absentes en `fr` » est à **0**. Le français,
  langue de référence, est complet — le problème est strictement celui des trois langues
  secondaires.

- **Effort** : décision 0,5 j ; traduction hors périmètre technique

---

## 2. Séquencement

### Sprint 1 — « rendre la dette visible » (5 j)
LOT 0 complet · A.1 · A.2 · A.3 · B.1
→ **Résultat** : la dette ne peut plus croître ; le focus est visible ; la police de marque
est réparée ; deux nouveaux cliquets sont armés. Aucune migration de masse.

### Sprint 2 — « ce qui est sensible » (8 j)
A.6 (modales POS) · A.5 priorité 1-2 · C.1 (contraste des tokens) · A.4 · D.1
→ **Résultat** : les écrans les plus critiques — caisse, connexion — deviennent
utilisables au clavier et lisibles. Les cartes convergent.

### Sprint 3 — « la boucle et l'échelle » (10 j, parallélisable)
**Voie 1 (code)** : D.2 · D.3 · E.1 · E.2
**Voie 2 (sans code, en parallèle)** : F.1 · F.2 · F.3
→ **Résultat** : le design system devient la voie par défaut, et les décisions d'interface
cessent d'être des hypothèses.

### Ensuite
A.7 · B.2 · B.3 · B.4 · C.2 · C.3 · D.4 · E.3 · F.4 · G.1 · G.2 · G.3 · G.4

---

## 3. Critères de sortie

Le plan est terminé quand **les huit conditions** sont vraies simultanément :

1. `[ ]` `npm run preflight` passe avec les deux nouveaux cliquets armés
2. `[ ]` `npm run measure` : `dsAdoption` ≤ 200 (départ 482) et `a11yControls` = 0 (départ 276)
3. `[ ]` `npm run measure:runtime` sur 15 routes × 4 paliers :
   `contrastesKO` = 0, `sansNom` = 0, `focusInvisible` = 0
4. `[ ]` Aucune police au statut `error` dans `document.fonts` sur les écrans principaux
5. `[ ]` Les 56 modales utilisent la primitive `Modal` ou `BottomSheet` rendue accessible
6. `[ ]` 4 fiches persona écrites et rattachées à des rôles RBAC réels
7. `[ ]` 1 campagne de test d'utilisabilité restituée, ses conclusions versées dans ce plan
8. `[ ]` `.gate-baseline.json` a été re-figé **à la baisse** au moins trois fois

> **Rappel Loi 2** : un seuil ne monte jamais. Si une action de ce plan demande de relever
> un cliquet, c'est que l'action est mal découpée — pas que le cliquet est trop strict.

---

## Annexes

### Annexe A.4 — Les 31 fichiers à poignées de clic non focalisables

```
src/app/(admin)/admin/mcc/components/TrustedDevicePanel.tsx        (2)
src/shared/components/ui/TimePicker.tsx                            (2)
src/shared/components/layout/AppLaunchpad.tsx                      (2)  ← capture technique
src/modules/commerce/relation/reservations/components/WeeklyView.tsx (2)
src/modules/commerce/acquisition/onboarding/wizard/OnboardingHelpButton.tsx (2)
src/modules/logistics/stock/inventory/components/InventoryInlineModals.tsx  (2)
src/modules/logistics/stock/inventory/components/inventory/OracleModal.tsx  (2)
src/app/(admin)/audit-portal/AuditPortalController.tsx             (1)
src/app/(admin)/admin/mcc/page.tsx                                 (1)
src/app/(admin)/admin/mcc/_tabs/SectorStudyTab.tsx                 (1)
src/app/(admin)/admin/mcc/components/FleetUpgradePanel.tsx         (1)
src/app/(admin)/admin/mcc/components/SupportAIPanel.tsx            (1)
src/app/(admin)/admin/mcc/components/TenantChangelogPanel.tsx      (1)
src/app/(admin)/admin/mcc/components/SupportDraftsPanel.tsx        (1)
src/app/(admin)/admin/mcc/components/FleetDeviceInventory.tsx      (1)  ← voile
src/app/(client)/(ops)/floor-plan/page.tsx                         (1)
src/shared/components/TutorialBubble.tsx                           (1)  ← voile
src/shared/components/settings/BrandUploader.tsx                   (1)
src/shared/components/settings/PrinterSettings.tsx                 (1)
src/shared/components/settings/SettingsDashboard.tsx               (1)  ← voile
src/shared/components/rbac/ActionGuard.tsx                         (1)  ← capture technique
src/modules/commerce/acquisition/marketing/components/crm/CRMContactForm.tsx (1) ← voile
… et 9 fichiers à 1 occurrence
```
> Régénérer la liste exacte : `node -e` sur le motif multi-lignes `<div\b[^>]*?\bonClick`
> — voir la mesure M12 (§ 0.2), qui l'expose dans `.measures/latest.json`.

### Annexe A.7 — Les 33 modales sans la primitive

```
PRIORITÉ 1 — sécurité caisse (§ A.6)
src/modules/commerce/ui/pos/PinModal.tsx                    200 l.  esc ✅  focus ✅
src/modules/commerce/ui/pos/VoidModal.tsx                   204 l.  — rien —
src/modules/commerce/ui/pos/CashDrawerModal.tsx             226 l.  — rien —
src/modules/commerce/ui/pos/SosCaisseModal.tsx              286 l.  — rien —

PRIORITÉ 2 — primitives et second PIN
src/shared/components/ui/BottomSheet.tsx                    143 l.  ← primitive à rendre accessible
src/modules/compliance/qualite/haccp/components/cleaning-plan/CleaningPinDialog.tsx  71 l.

PRIORITÉ 3 — écrans produit
src/modules/ops/service/pos/components/CashCounterModal.tsx 192 l.
src/modules/ops/menu-builder/components/ProductEditModal.tsx 160 l.
src/modules/ops/workflow/engine/components/OperationsAreaModal.tsx 128 l.
src/modules/commerce/ui/pos/ModifierModal.tsx               182 l.
src/modules/commerce/relation/reservations/components/EventQuoteModal.tsx 266 l.
src/modules/commerce/relation/reservations/components/GroupFormModal.tsx  166 l.
src/modules/commerce/relation/franchise/components/_parts/NewTransferModal.tsx 104 l.
src/modules/commerce/acquisition/marketing/components/marketing/NewCampaignModal.tsx 208 l.
src/modules/commerce/acquisition/marketing/components/marketing/NewPostModal.tsx     182 l.
src/modules/commerce/acquisition/marketing/components/marketing/NewSegmentModal.tsx  182 l.
src/modules/human/effectifs/hr/components/QuickAddStaffModal.tsx       238 l.  focus ✅
src/modules/human/effectifs/hr/components/leaves/NewRequestModal.tsx   217 l.
src/modules/human/effectifs/hr/components/planning/ShiftEditModal.tsx  156 l.
src/modules/human/effectifs/hr/components/recruitment-dashboard/AddCandidateModal.tsx 266 l.
src/modules/facility/components/equipment/AddEquipmentModal.tsx        183 l.
src/modules/facility/components/equipment/AddGuideModal.tsx            224 l.
src/modules/facility/components/equipment/EquipmentDetailModal.tsx     179 l.
src/modules/compliance/legal/components/TenantContractSignModal.tsx    327 l.
src/modules/compliance/legal/components/contracts/MCCConsultModal.tsx  153 l.
src/modules/compliance/legal/components/contracts/MCCCreateContractModal.tsx 245 l.
src/modules/logistics/stock/inventory/components/inventory/InvoiceReviewModal.tsx 171 l.
src/modules/logistics/stock/inventory/components/inventory/OracleModal.tsx         53 l.
src/modules/intelligence/analytique/analytics/components/OracleChatDrawer.tsx  214 l.  focus ✅
src/modules/intelligence/connectors/hub/components/ConnectorConfigModal.tsx    131 l.
src/modules/finance/components/dashboard/BankModal.tsx                  29 l.
src/app/(admin)/admin/mcc/_tabs/system-tenants/PromotionModal.tsx      119 l.
src/app/(client)/(ordering)/order/[tenantId]/components/OrderCartDrawer.tsx 199 l.
```

### Annexe M — Commandes de vérification

```bash
npm run measure            # 13 mesures après le LOT 0 (11 aujourd'hui)
npm run measure:detail     # avec le détail fichier par fichier
npm run measure:runtime    # sonde de rendu — nécessite le serveur sur :3455
npm run preflight          # gate complète, cliquets compris
node scripts/gate-last-mile.mjs        # Gate 6 seule
node scripts/verify-gate-integrity.mjs # refuse tout desserrement de seuil
npm run check:figma-guard  # 4 garde-fous de refonte visuelle
npx vitest run figma-redesign          # invariants de refonte
npx playwright test tests/e2e          # 8 suites de parcours
```

---

*Plan établi le 2026-08-27 à partir de l'audit des 16 axes UI/UX. Baseline mesurée en
session — à re-mesurer avant toute mise à jour de ce fichier (Loi 7).*
